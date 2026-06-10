import { CustomOrderStatus, PaymentStatus, ProductStatus, RefundRequestStatus, ShippingStatus } from "@prisma/client";
import { getSellerUnreadMessageCount } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

export type SellerSidebarBadgeValue = number | "!";

export type SellerSidebarBadges = Record<string, SellerSidebarBadgeValue>;

function addNumericBadge(badges: SellerSidebarBadges, href: string, value: number) {
  if (value > 0) {
    badges[href] = value;
  }
}

export async function getSellerSidebarBadges() {
  const emptyBadges = {
    dashboard: 0,
    listings: 0,
    inventory: 0,
    orders: 0,
    messages: 0,
    customRequests: 0,
    reviews: 0,
    shipping: 0,
    productCatalogue: 0,
    payments: 0,
    analytics: 0,
    settings: 0,
  };

  const safe = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await promise;
    } catch {
      console.warn("[seller sidebar] badge query failed; using fallback data.");
      return fallback;
    }
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    const { getCurrentUser } = await import("@/lib/auth");
    const db = prisma as any;

    const currentUser = await safe(getCurrentUser(), null as any);

    const shop =
      (currentUser?.id
        ? await safe(db.shop.findFirst({ where: { sellerId: currentUser.id } }), null)
        : null) ??
      (currentUser?.id
        ? await safe(db.shop.findFirst({ where: { ownerId: currentUser.id } }), null)
        : null) ??
      (currentUser?.email
        ? await safe(db.shop.findFirst({ where: { owner: { email: currentUser.email } } }), null)
        : null) ??
      (await safe(db.shop.findFirst(), null));

    if (!shop?.id) {
      return emptyBadges;
    }

    const shopId = shop.id;

    const listings = await safe(
      db.product.count({ where: { shopId, status: "NEEDS_REVIEW" } }),
      0
    );

    const inventory = await safe(
      db.product.count({
        where: {
          shopId,
          OR: [{ stock: { lte: 5 } }, { quantity: { lte: 5 } }],
        },
      }),
      0
    );

    const orders = await safe(
      db.order.count({
        where: {
          shopId,
          paymentStatus: { not: "REFUNDED" },
          shippingStatus: { not: "DELIVERED" },
        },
      }),
      0
    );

    const messages = await safe(
      (db.message?.count?.({
        where: {
          shopId,
          status: "UNREAD",
        },
      }) ?? Promise.resolve(0)),
      0
    );

    const customRequestModel = db.customOrderRequest ?? db.customRequest;
    const customRequests = await safe(
      (customRequestModel?.count?.({
        where: {
          shopId,
          status: "OPEN",
        },
      }) ?? Promise.resolve(0)),
      0
    );

    const reviews = await safe(
      db.review.count({
        where: {
          shopId,
          sellerResponse: null,
        },
      }),
      0
    );

    const shipping = await safe(
      db.product.count({
        where: {
          shopId,
          shippingProfileId: null,
        },
      }),
      0
    );

    const payments = await safe(
      db.order.count({
        where: {
          shopId,
          paymentStatus: "PENDING",
        },
      }),
      0
    );

    return {
      ...emptyBadges,
      listings,
      inventory,
      orders,
      messages,
      customRequests,
      reviews,
      shipping,
      productCatalogue: listings,
      payments,
    };
  } catch {
    console.warn("[seller sidebar] failed to load badges; using fallback data.");
    return emptyBadges;
  }
}
