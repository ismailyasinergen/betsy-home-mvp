import { prisma } from "@/lib/prisma";
import {
  sendAdminManualRefundFollowup,
  sendNotification,
  sendRefundApproved,
  sendRefundRejected,
  sendRefundRequestSubmitted,
  sendSellerNewOrderAlert,
  sendShippingUpdate,
} from "@/lib/notification-service";


async function findDemoCustomerEmail() {
  const fallback = process.env.DEMO_CUSTOMER_EMAIL ?? "customer@betsyhome.test";
  const allowDemoFallback =
    process.env.NODE_ENV !== "production" ||
    process.env.DEMO_CUSTOMER_EMAIL_FALLBACK_ENABLED === "true";

  try {
    const user = await (prisma as any).user.findFirst({
      where: { email: fallback },
      select: { email: true },
    });

    return user?.email ?? (allowDemoFallback ? fallback : undefined);
  } catch {
    return allowDemoFallback ? fallback : undefined;
  }
}

async function findUserEmailByAnyId(id: string | null | undefined) {
  if (!id) return undefined;

  try {
    const user = await (prisma as any).user.findFirst({
      where: { id },
      select: { email: true },
    });

    return user?.email ?? undefined;
  } catch {
    return undefined;
  }
}

type Row = Record<string, any>;

function value<T = any>(row: Row | null | undefined, fields: string[]) {
  if (!row) return undefined;
  for (const field of fields) {
    const candidate = row[field];
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      return candidate as T;
    }
  }
  return undefined;
}

function money(raw: unknown) {
  const amount =
    typeof (raw as any)?.toNumber === "function"
      ? (raw as any).toNumber()
      : Number(raw ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function getOrder(ref: string) {
  const db = prisma as any;

  const byId = await db.order.findUnique({ where: { id: ref } }).catch(() => null);
  if (byId) return byId;

  return db.order
    .findFirst({
      where: {
        OR: [{ orderNumber: ref }, { number: ref }, { code: ref }, { reference: ref }],
      },
    })
    .catch(async () => {
      return db.order.findFirst({ where: { orderNumber: ref } }).catch(() => null);
    });
}

async function getUserEmail(userId?: string | null) {
  if (!userId) return undefined;
  const db = prisma as any;
  const user = await db.user.findUnique({ where: { id: userId } }).catch(() => null);
  return value<string>(user, ["email", "emailAddress"]);
}

async function getShop(shopId?: string | null) {
  if (!shopId) return null;
  const db = prisma as any;
  return db.shop.findUnique({ where: { id: shopId } }).catch(() => null);
}

async function getFirstItem(orderId: string) {
  const db = prisma as any;
  if (db.orderItem?.findFirst) {
    return db.orderItem.findFirst({ where: { orderId } }).catch(() => null);
  }
  if (db.orderLineItem?.findFirst) {
    return db.orderLineItem.findFirst({ where: { orderId } }).catch(() => null);
  }
  return null;
}

async function getProduct(productId?: string | null) {
  if (!productId) return null;
  const db = prisma as any;
  return db.product.findUnique({ where: { id: productId } }).catch(() => null);
}

async function resolvePayload(order: Row) {
  const shop = await getShop(value<string>(order, ["shopId", "storeId"]));
  const item = await getFirstItem(order.id);
  const product = await getProduct(value<string>(item, ["productId", "listingId"]));

  let customerEmail = value<string>(order, [
    "customerEmail",
    "buyerEmail",
    "email",
    "contactEmail",
  ]);

  if (!customerEmail) {
    for (const id of [
      value<string>(order, ["customerId"]),
      value<string>(order, ["buyerId"]),
      value<string>(order, ["userId"]),
      value<string>(order, ["customerUserId"]),
      value<string>(order, ["accountId"]),
    ]) {
      customerEmail = await getUserEmail(id);
      if (customerEmail) break;
    }
  }

  if (!customerEmail) {
    customerEmail = await findDemoCustomerEmail();
  }

  let sellerEmail = value<string>(order, ["sellerEmail", "shopEmail", "merchantEmail"]);
  sellerEmail ||= value<string>(shop, ["sellerEmail", "ownerEmail", "email", "contactEmail"]);

  if (!sellerEmail) {
    for (const id of [
      value<string>(order, ["sellerId", "ownerId"]),
      value<string>(shop, ["sellerId"]),
      value<string>(shop, ["ownerId"]),
      value<string>(shop, ["userId"]),
    ]) {
      sellerEmail = await getUserEmail(id);
      if (sellerEmail) break;
    }
  }

  const orderNumber = value<string>(order, ["orderNumber", "number", "code", "reference"]) ?? order.id;

  return {
    orderNumber,
    orderTotal: money(value(order, ["total", "totalAmount", "amount", "subtotal"]) ?? 0),
    shopName:
      value<string>(shop, ["shopName", "name", "title"]) ??
      value<string>(order, ["shopName", "sellerName"]) ??
      "Betsy Home",
    customerEmail,
    sellerEmail,
    productTitle:
      value<string>(product, ["title", "name"]) ??
      value<string>(item, ["productTitle", "title", "name"]) ??
      "your item",
    trackingCarrier: value<string>(order, ["trackingCarrier", "carrier", "shippingCarrier"]),
    trackingNumber: value<string>(order, ["trackingNumber", "trackingCode", "shippingTrackingNumber"]),
    trackingUrl: value<string>(order, ["trackingUrl", "trackingURL", "shippingTrackingUrl"]),
    refundReason: value<string>(order, ["refundReason", "cancellationReason"]),
    resolutionNote: value<string>(order, ["refundResolutionNote", "resolutionNote", "refundNote"]),
    adminReference: value<string>(order, ["stripeRefundId", "manualRefundReference", "refundReference"]),
    actionUrl: `${baseUrl()}/account/orders/${order.id}`,
  };
}

async function getAdminEmail() {
  return process.env.ADMIN_EMAIL ?? process.env.SUPPORT_EMAIL ?? "admin@betsyhome.test";
}

export async function notifyOrderCreated(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, reason: "order_not_found", orderId };

  const payload = await resolvePayload(order);
  const results = [];
  const skipped = [];

  if (payload.customerEmail) {
    results.push(
      await sendNotification({
        kind: "order_confirmation",
        to: payload.customerEmail,
        payload,
      })
    );
  } else {
    skipped.push("customer_email_not_found");
  }

  if (payload.sellerEmail) {
    results.push(await sendSellerNewOrderAlert(payload.sellerEmail, payload));
  } else {
    skipped.push("seller_email_not_found");
  }

  return {
    ok: true,
    event: "order_created",
    orderId,
    notifications: results.length,
    skipped,
    resolved: {
      customerEmail: payload.customerEmail ?? null,
      sellerEmail: payload.sellerEmail ?? null,
      shopName: payload.shopName,
      orderNumber: payload.orderNumber,
    },
    results,
  };
}

export async function notifyShippingUpdated(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, reason: "order_not_found", orderId };

  const payload = await resolvePayload(order);
  if (!payload.customerEmail) {
    return { ok: false, reason: "customer_email_not_found", orderId, resolved: payload };
  }

  const result = await sendShippingUpdate(payload.customerEmail, payload);
  return { ok: true, event: "shipping_updated", orderId, notifications: 1, resolved: payload, result };
}

export async function notifyRefundRequested(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, reason: "order_not_found", orderId };

  const payload = await resolvePayload(order);
  const results = [];
  const skipped = [];

  if (payload.sellerEmail) {
    results.push(await sendRefundRequestSubmitted(payload.sellerEmail, payload));
  } else {
    skipped.push("seller_email_not_found");
  }

  results.push(
    await sendRefundRequestSubmitted(await getAdminEmail(), {
      ...payload,
      actionUrl: `${baseUrl()}/admin/refunds`,
    })
  );

  return { ok: true, event: "refund_requested", orderId, notifications: results.length, skipped, resolved: payload, results };
}

export async function notifyRefundResolved(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, reason: "order_not_found", orderId };

  const payload = await resolvePayload(order);
  if (!payload.customerEmail) {
    return { ok: false, reason: "customer_email_not_found", orderId, resolved: payload };
  }

  const status = String(value(order, ["refundRequestStatus", "refundStatus"]) ?? "").toUpperCase();
  const result =
    status === "REJECTED" || status === "DECLINED"
      ? await sendRefundRejected(payload.customerEmail, payload)
      : await sendRefundApproved(payload.customerEmail, payload);

  return { ok: true, event: "refund_resolved", orderId, notifications: 1, resolved: { ...payload, refundStatus: status || null }, result };
}

export async function notifyManualRefundFollowup(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, reason: "order_not_found", orderId };

  const payload = { ...(await resolvePayload(order)), actionUrl: `${baseUrl()}/admin/refunds` };
  const adminEmail = await getAdminEmail();
  const result = await sendAdminManualRefundFollowup(adminEmail, payload);

  return { ok: true, event: "manual_refund_followup", orderId, notifications: 1, resolved: { adminEmail, ...payload }, result };
}

export const notificationEventHandlers = {
  order_created: notifyOrderCreated,
  shipping_updated: notifyShippingUpdated,
  refund_requested: notifyRefundRequested,
  refund_resolved: notifyRefundResolved,
  manual_refund_followup: notifyManualRefundFollowup,
};
