import Link from "next/link";
import { PaymentStatus, ProductStatus, RefundRequestStatus, ShippingStatus } from "@prisma/client";
import { getAdminActivityData } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

function shortDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function badgeTone(tone: "green" | "red" | "amber" | "cream" = "cream") {
  if (tone === "green") return "bg-green-100 text-green-800";
  if (tone === "red") return "bg-red-100 text-red-700";
  if (tone === "amber") return "bg-amber-100 text-amber-800";
  return "bg-cream text-charcoal/70";
}

function paymentTone(status: PaymentStatus) {
  if (status === PaymentStatus.PAID) return "green" as const;
  if (status === PaymentStatus.REFUNDED || status === PaymentStatus.DISPUTED) return "red" as const;
  return "amber" as const;
}

function shippingTone(status: ShippingStatus) {
  if (status === ShippingStatus.DELIVERED) return "green" as const;
  if (status === ShippingStatus.CANCELLED) return "red" as const;
  return "amber" as const;
}

function refundTone(status: RefundRequestStatus) {
  if (status === RefundRequestStatus.APPROVED) return "green" as const;
  if (status === RefundRequestStatus.REJECTED) return "red" as const;
  if (status === RefundRequestStatus.REQUESTED) return "amber" as const;
  return "cream" as const;
}

function statusBadge({ label, tone }: { label: string; tone?: "green" | "red" | "amber" | "cream" }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeTone(tone)}`}>{label}</span>;
}

export default async function AdminActivityPage() {
  const { recentOrders, refundEvents, recentReviews, recentMessages, recentCustomRequests, productAlerts } = await getAdminActivityData();

  const needsAction =
    (refundEvents ?? []).filter((order) => order.refundRequestStatus === RefundRequestStatus.REQUESTED).length +
    (recentReviews ?? []).filter((review) => !review.sellerResponse).length +
    (recentCustomRequests ?? []).filter((request) => request.status === "OPEN").length +
    (productAlerts ?? []).length;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Marketplace activity</h1>
      <p className="mt-3 max-w-3xl text-charcoal/70">
        A live operations feed for new orders, refund requests, reviews, messages, custom requests, and catalogue health alerts.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Recent orders</p>
          <p className="mt-2 text-3xl font-bold">{recentOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Refund activity</p>
          <p className="mt-2 text-3xl font-bold">{refundEvents.length}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Latest reviews</p>
          <p className="mt-2 text-3xl font-bold">{recentReviews.length}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Product alerts</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{(productAlerts ?? []).length}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Needs action</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{needsAction}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Recent order activity</h2>
            <Link href="/admin/orders" className="rounded-full border border-clay px-4 py-2 text-sm font-bold text-clay">View orders</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {(recentOrders ?? []).map((order) => (
              <div key={order.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{order.orderNumber}</p>
                  <p className="font-bold">${money(order.total)}</p>
                </div>
                <p className="mt-1 text-sm text-charcoal/60">{order.shop.shopName} · {order.buyer?.email ?? "guest"} · {shortDate(order.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusBadge({ label: `Payment: ${order.paymentStatus}`, tone: paymentTone(order.paymentStatus) })}
                  {statusBadge({ label: `Shipping: ${order.shippingStatus}`, tone: shippingTone(order.shippingStatus) })}
                  {order.refundRequestStatus !== RefundRequestStatus.NONE ? statusBadge({ label: `Refund: ${order.refundRequestStatus}`, tone: refundTone(order.refundRequestStatus) }) : null}
                </div>
                <p className="mt-2 text-sm text-charcoal/60">{order.items.map((item) => `${item.quantity} × ${item.titleSnapshot}`).join(" · ")}</p>
              </div>
            ))}
            {recentOrders.length === 0 ? <p className="text-charcoal/70">No orders yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Refund & dispute activity</h2>
            <Link href="/admin/refunds" className="rounded-full border border-clay px-4 py-2 text-sm font-bold text-clay">View refunds</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {(refundEvents ?? []).map((order) => (
              <div key={order.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{order.orderNumber}</p>
                  {statusBadge({ label: order.refundRequestStatus, tone: refundTone(order.refundRequestStatus) })}
                </div>
                <p className="mt-1 text-sm text-charcoal/60">{order.shop.shopName} · seller {order.shop.seller.email} · buyer {order.buyer?.email ?? "guest"}</p>
                <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">{order.refundReason ?? "No customer reason recorded."}</p>
                {order.refundStripeRefundId ? <p className="mt-2 text-sm text-green-700">Reference: {order.refundStripeRefundId}</p> : null}
                {!order.refundStripeRefundId && order.paymentStatus === PaymentStatus.REFUNDED ? <p className="mt-2 text-sm font-bold text-red-700">Manual Stripe follow-up needed</p> : null}
              </div>
            ))}
            {refundEvents.length === 0 ? <p className="text-charcoal/70">No refund or dispute activity yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Reviews needing attention</h2>
            <Link href="/admin/reports" className="rounded-full border border-clay px-4 py-2 text-sm font-bold text-clay">View reports</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {(recentReviews ?? []).map((review) => (
              <div key={review.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{review.rating}★ · {review.product.title}</p>
                  {!review.sellerResponse ? statusBadge({ label: "Needs seller response", tone: "red" }) : statusBadge({ label: "Seller replied", tone: "green" })}
                </div>
                <p className="mt-1 text-sm text-charcoal/60">{review.shop.shopName} · {review.buyer.email} · {shortDate(review.createdAt)}</p>
                <p className="mt-2 line-clamp-3 text-sm text-charcoal/70">{review.comment ?? "No written comment."}</p>
              </div>
            ))}
            {recentReviews.length === 0 ? <p className="text-charcoal/70">No reviews yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Messages & custom requests</h2>
          <div className="mt-4 grid gap-3">
            {(recentCustomRequests ?? []).map((request) => (
              <div key={request.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">Custom request · {request.shop.shopName}</p>
                  {statusBadge({ label: request.status, tone: request.status === "OPEN" ? "red" : "cream" })}
                </div>
                <p className="mt-1 text-sm text-charcoal/60">{request.buyer.email} · {shortDate(request.createdAt)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">{request.message}</p>
              </div>
            ))}
            {(recentMessages ?? []).map((message) => (
              <div key={message.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">Message · {message.shop?.shopName ?? "Marketplace"}</p>
                  {statusBadge({ label: message.status, tone: message.status === "UNREAD" ? "red" : "cream" })}
                </div>
                <p className="mt-1 text-sm text-charcoal/60">{message.sender?.email ?? message.senderEmail ?? 'Unknown sender'} → {message.receiver?.email ?? message.receiverEmail ?? 'Unknown receiver'} · {shortDate(message.createdAt)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">{message.message ?? message.body ?? message.content ?? 'No message text'}</p>
              </div>
            ))}
            {recentCustomRequests.length === 0 && recentMessages.length === 0 ? <p className="text-charcoal/70">No recent messages or custom requests.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Product catalogue alerts</h2>
            <Link href="/admin/products" className="rounded-full border border-clay px-4 py-2 text-sm font-bold text-clay">View products</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(productAlerts ?? []).map((product) => {
              const alerts = [
                product.status === ProductStatus.NEEDS_REVIEW ? "Needs review" : null,
                product.status === ProductStatus.SOLD_OUT ? "Sold out" : null,
                product.quantity <= 3 ? `Low stock: ${product.quantity}` : null,
                !product.shippingProfileId ? "Missing shipping" : null
              ].filter(Boolean);
              return (
                <div key={product.id} className="rounded-2xl bg-cream p-4">
                  <p className="font-bold">{product.title ?? product.name ?? 'Untitled product'}</p>
                  <p className="mt-1 text-sm text-charcoal/60">{product.shop?.shopName ?? product.shopName ?? 'Unknown shop'} · {product.category?.name ?? product.categoryName ?? 'Uncategorized'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {alerts.map((alert) => statusBadge({ label: String(alert), tone: "red" }))}
                  </div>
                </div>
              );
            })}
            {(productAlerts ?? []).length === 0 ? <p className="text-charcoal/70">No product alerts right now.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
