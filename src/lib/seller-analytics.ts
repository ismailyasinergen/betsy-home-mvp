import { prisma } from "@/lib/prisma";

const db = prisma as any;

type AnyRecord = Record<string, any>;

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.warn("[seller analytics] query failed; using fallback data.");
    return fallback;
  }
}

function cents(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n;
}

export function formatMoney(centsValue: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsValue / 100);
}

function orderTotalCents(order: AnyRecord): number {
  return cents(
    order.totalCents ??
      order.totalAmountCents ??
      order.amountCents ??
      order.subtotalCents ??
      order.total ??
      0
  );
}

function orderFeeCents(order: AnyRecord): number {
  const explicit = order.platformFeeCents ?? order.feeCents ?? order.marketplaceFeeCents;
  if (explicit !== undefined && explicit !== null) return cents(explicit);
  const total = orderTotalCents(order);
  return Math.round(total * 0.1);
}

function itemRevenueCents(item: AnyRecord, order: AnyRecord): number {
  const explicit =
    item.totalCents ??
    item.lineTotalCents ??
    item.priceTotalCents ??
    item.amountCents;
  if (explicit !== undefined && explicit !== null) return cents(explicit);

  const quantity = Number(item.quantity ?? 1) || 1;
  const unit = cents(item.unitPriceCents ?? item.priceCents ?? item.product?.priceCents ?? 0);
  if (unit > 0) return unit * quantity;

  const orderItems = Array.isArray(order.items) ? order.items : [];
  if (orderItems.length === 1) return orderTotalCents(order);
  return 0;
}

function paymentStatus(order: AnyRecord): string {
  return String(order.paymentStatus ?? "UNKNOWN");
}

function shippingStatus(order: AnyRecord): string {
  return String(order.shippingStatus ?? "UNKNOWN");
}

function productStock(product: AnyRecord): number | null {
  const value =
    product.stock ??
    product.stockQuantity ??
    product.inventoryQuantity ??
    product.quantity ??
    product.unitsAvailable;
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function productNeedsReview(product: AnyRecord): boolean {
  const status = String(product.status ?? product.reviewStatus ?? "").toUpperCase();
  return (
    status.includes("REVIEW") ||
    status.includes("DRAFT") ||
    product.needsReview === true ||
    product.isApproved === false
  );
}

function productMissingShipping(product: AnyRecord): boolean {
  if (product.shippingProfile) return false;
  if (product.shippingProfileId) return false;
  if (product.shippingProfileID) return false;
  return true;
}

function productTitle(product: AnyRecord | undefined): string {
  return product?.title ?? product?.name ?? product?.productName ?? "Untitled product";
}

function shopName(shop: AnyRecord | undefined): string {
  return shop?.shopName ?? shop?.name ?? "Your shop";
}

export async function getSellerAnalyticsData(userId: string) {
  const shop = await safe(
    db.shop.findFirst({
      where: { ownerId: userId },
      include: {
        products: {
          include: {
            shippingProfile: true,
            category: true,
          },
        },
      },
    }),
    null
  );

  if (!shop) {
    return {
      shop: null,
      orders: [],
      reviews: [],
      products: [],
      topProducts: [],
      metrics: {
        paidGrossCents: 0,
        platformFeeCents: 0,
        sellerNetCents: 0,
        pendingCents: 0,
        refundedCents: 0,
        paidOrderCount: 0,
        pendingOrderCount: 0,
        refundedOrderCount: 0,
        averageOrderCents: 0,
        reviewCount: 0,
        averageRating: 0,
        responseNeeded: 0,
        refundRate: 0,
        activeListings: 0,
        totalUnits: 0,
        lowStock: 0,
        soldOut: 0,
        missingShipping: 0,
        needsReview: 0,
      },
    };
  }

  const shopId = shop.id;

  const orders = await safe(
    db.order.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: true,
        items: { include: { product: true } },
      },
    }),
    []
  );

  const reviews = await safe(
    db.review.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: true,
        product: true,
      },
    }),
    []
  );

  const products = Array.isArray(shop.products) ? shop.products : [];

  const paidOrders = orders.filter((order: AnyRecord) => paymentStatus(order) === "PAID");
  const pendingOrders = orders.filter((order: AnyRecord) => paymentStatus(order) === "PENDING");
  const refundedOrders = orders.filter((order: AnyRecord) => paymentStatus(order) === "REFUNDED");

  const paidGrossCents = paidOrders.reduce((sum: number, order: AnyRecord) => sum + orderTotalCents(order), 0);
  const platformFeeCents = paidOrders.reduce((sum: number, order: AnyRecord) => sum + orderFeeCents(order), 0);
  const pendingCents = pendingOrders.reduce((sum: number, order: AnyRecord) => sum + orderTotalCents(order), 0);
  const refundedCents = refundedOrders.reduce((sum: number, order: AnyRecord) => sum + orderTotalCents(order), 0);

  const responseNeeded = reviews.filter((review: AnyRecord) => !review.sellerResponse && !review.sellerResponseText).length;
  const ratingValues = reviews.map((review: AnyRecord) => Number(review.rating ?? 0)).filter((rating: number) => rating > 0);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((sum: number, rating: number) => sum + rating, 0) / ratingValues.length
    : 0;

  const topProductMap = new Map<string, AnyRecord>();
  for (const order of paidOrders) {
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const product = item.product ?? {};
      const key = String(product.id ?? item.productId ?? productTitle(product));
      const current = topProductMap.get(key) ?? {
        id: key,
        title: productTitle(product),
        quantity: 0,
        revenueCents: 0,
      };
      const quantity = Number(item.quantity ?? 1) || 1;
      current.quantity += quantity;
      current.revenueCents += itemRevenueCents(item, order);
      topProductMap.set(key, current);
    }
  }

  const topProducts = [...topProductMap.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 8);

  const inventory = products.map((product: AnyRecord) => {
    const stock = productStock(product);
    return {
      id: product.id,
      title: productTitle(product),
      stock,
      missingShipping: productMissingShipping(product),
      needsReview: productNeedsReview(product),
      lowStock: stock !== null && stock > 0 && stock <= 5,
      soldOut: stock !== null && stock <= 0,
    };
  });

  const totalUnits = inventory.reduce((sum: number, product: AnyRecord) => sum + Math.max(0, Number(product.stock ?? 0)), 0);
  const activeListings = products.filter((product: AnyRecord) => {
    const status = String(product.status ?? "ACTIVE").toUpperCase();
    return !status.includes("ARCHIVED") && !status.includes("DELETED");
  }).length;

  const metrics = {
    paidGrossCents,
    platformFeeCents,
    sellerNetCents: Math.max(0, paidGrossCents - platformFeeCents),
    pendingCents,
    refundedCents,
    paidOrderCount: paidOrders.length,
    pendingOrderCount: pendingOrders.length,
    refundedOrderCount: refundedOrders.length,
    averageOrderCents: paidOrders.length ? Math.round(paidGrossCents / paidOrders.length) : 0,
    reviewCount: reviews.length,
    averageRating,
    responseNeeded,
    refundRate: paidOrders.length + refundedOrders.length
      ? Math.round((refundedOrders.length / (paidOrders.length + refundedOrders.length)) * 100)
      : 0,
    activeListings,
    totalUnits,
    lowStock: inventory.filter((product: AnyRecord) => product.lowStock).length,
    soldOut: inventory.filter((product: AnyRecord) => product.soldOut).length,
    missingShipping: inventory.filter((product: AnyRecord) => product.missingShipping).length,
    needsReview: inventory.filter((product: AnyRecord) => product.needsReview).length,
  };

  return {
    shop: { ...shop, displayName: shopName(shop) },
    orders,
    reviews,
    products: inventory,
    topProducts,
    metrics,
  };
}

export function sellerAnalyticsCsvRows(data: Awaited<ReturnType<typeof getSellerAnalyticsData>>) {
  const rows: string[][] = [
    ["section", "metric", "value"],
    ["summary", "shop", data.shop?.displayName ?? "No shop"],
    ["summary", "paid_gross", formatMoney(data.metrics.paidGrossCents)],
    ["summary", "platform_fees", formatMoney(data.metrics.platformFeeCents)],
    ["summary", "seller_net_preview", formatMoney(data.metrics.sellerNetCents)],
    ["summary", "pending_value", formatMoney(data.metrics.pendingCents)],
    ["summary", "refunded_value", formatMoney(data.metrics.refundedCents)],
    ["summary", "paid_orders", String(data.metrics.paidOrderCount)],
    ["summary", "pending_orders", String(data.metrics.pendingOrderCount)],
    ["summary", "refund_rate", `${data.metrics.refundRate}%`],
    ["summary", "average_rating", data.metrics.averageRating.toFixed(1)],
    ["summary", "reviews_needing_response", String(data.metrics.responseNeeded)],
    ["summary", "active_listings", String(data.metrics.activeListings)],
    ["summary", "total_units", String(data.metrics.totalUnits)],
  ];

  rows.push([]);
  rows.push(["top_products", "product", "quantity", "revenue"]);
  for (const product of data.topProducts) {
    rows.push(["top_products", product.title, String(product.quantity), formatMoney(product.revenueCents)]);
  }

  rows.push([]);
  rows.push(["inventory", "product", "stock", "missing_shipping", "needs_review"]);
  for (const product of data.products) {
    rows.push([
      "inventory",
      product.title,
      product.stock === null ? "unknown" : String(product.stock),
      product.missingShipping ? "yes" : "no",
      product.needsReview ? "yes" : "no",
    ]);
  }

  return rows;
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
        })
        .join(",")
    )
    .join("\n");
}
