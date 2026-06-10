import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function isDemoFallbackAllowed() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEMO_SELLER_FALLBACKS_ENABLED !== "false"
  );
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    console.warn("[seller ownership] query failed; using fallback result.");
    return fallback;
  }
}

export async function getSellerShopForCurrentUser() {
  const db = prisma as any;
  const currentUser = await safe(getCurrentUser(), null as any);

  if (!currentUser?.id && !currentUser?.email) {
    return null;
  }

  if (currentUser?.id) {
    const bySellerId = await safe(
      db.shop.findFirst({ where: { sellerId: currentUser.id } }),
      null
    );
    if (bySellerId) return bySellerId;

    const byOwnerId = await safe(
      db.shop.findFirst({ where: { ownerId: currentUser.id } }),
      null
    );
    if (byOwnerId) return byOwnerId;

    const byUserId = await safe(
      db.shop.findFirst({ where: { userId: currentUser.id } }),
      null
    );
    if (byUserId) return byUserId;
  }

  if (currentUser?.email) {
    const byOwnerEmail = await safe(
      db.shop.findFirst({ where: { owner: { email: currentUser.email } } }),
      null
    );
    if (byOwnerEmail) return byOwnerEmail;

    const bySellerEmail = await safe(
      db.shop.findFirst({ where: { seller: { email: currentUser.email } } }),
      null
    );
    if (bySellerEmail) return bySellerEmail;
  }

  // Local demo rescue only. This must never run in production.
  if (isDemoFallbackAllowed() && currentUser?.email?.toLowerCase() === "betsywaow@gmail.com") {
    const betsyShop =
      (await safe(db.shop.findFirst({ where: { shopName: "Betsy Clay Atelier" } }), null)) ??
      (await safe(db.shop.findFirst({ where: { name: "Betsy Clay Atelier" } }), null));

    if (betsyShop) return betsyShop;
  }

  return null;
}

export async function requireSellerShopForCurrentUser() {
  const shop = await getSellerShopForCurrentUser();

  if (!shop?.id) {
    throw new Error("No seller shop is linked to the current user.");
  }

  return shop;
}

export async function sellerOwnsShop(shopId: string) {
  const shop = await getSellerShopForCurrentUser();
  return Boolean(shop?.id && shop.id === shopId);
}

export async function sellerOwnsOrder(orderId: string) {
  const db = prisma as any;
  const shop = await getSellerShopForCurrentUser();
  if (!shop?.id) return false;

  const order = await safe(
    db.order.findFirst({ where: { id: orderId, shopId: shop.id }, select: { id: true } }),
    null
  );

  return Boolean(order?.id);
}

export async function sellerOwnsProduct(productId: string) {
  const db = prisma as any;
  const shop = await getSellerShopForCurrentUser();
  if (!shop?.id) return false;

  const product = await safe(
    db.product.findFirst({ where: { id: productId, shopId: shop.id }, select: { id: true } }),
    null
  );

  return Boolean(product?.id);
}
