import { PaymentStatus, RefundRequestStatus } from "@prisma/client";
import { getAdminRefundsData } from "@/lib/admin-data";
import { approveAdminRefundRequestAction, markManualRefundResolvedAction, rejectAdminRefundRequestAction } from "./actions";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function statusLabel(value: string | null | undefined) {
  return String(value ?? "NONE").replaceAll("_", " ");
}

function statusClass(status: string | null | undefined) {
  if (status === "REQUESTED") return "bg-yellow-100 text-yellow-800";
  if (status === "APPROVED") return "bg-green-100 text-green-800";
  if (status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-cream text-clay";
}

export default async function AdminRefundsPage() {
  const data = await getAdminRefundsData();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Refunds & disputes</h1>
      <p className="mt-3 max-w-3xl text-charcoal/70">
        Review customer cancellation requests, seller decisions, rejected requests, and Stripe/manual refund follow-ups across the marketplace.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Needs review</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{data.requestedRefunds}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Approved</p>
          <p className="mt-2 text-3xl font-bold">{data.approvedRefunds}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Rejected</p>
          <p className="mt-2 text-3xl font-bold">{data.rejectedRefunds}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Manual follow-up</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{data.manualFollowUps}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Refund/request value</p>
          <p className="mt-2 text-3xl font-bold">${money(data.refundGrossValue)}</p>
          <p className="mt-1 text-xs text-charcoal/50">Fees: ${money(data.refundPlatformFees)}</p>
        </div>
      </div>

      <section className="mt-8 grid gap-5">
        {data.orders.length === 0 ? (
          <div className="rounded-3xl border border-sand bg-white p-8 text-charcoal/70 shadow-sm">
            No refund or dispute activity yet.
          </div>
        ) : null}

        {data.orders.map((order) => {
          const needsManualFollowUp =
            order.refundRequestStatus === RefundRequestStatus.APPROVED &&
            order.paymentStatus === PaymentStatus.REFUNDED &&
            !order.refundStripeRefundId;

          return (
            <article key={order.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <div className="grid gap-6 xl:grid-cols-[1fr_28rem] xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(order.refundRequestStatus)}`}>
                      {statusLabel(order.refundRequestStatus)}
                    </span>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">Payment: {statusLabel(order.paymentStatus)}</span>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">Shipping: {statusLabel(order.shippingStatus)}</span>
                    {needsManualFollowUp ? (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Manual Stripe follow-up</span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-charcoal/60">
                    Seller: {order.shop.shopName} ({order.shop.seller.email}) · Buyer: {order.buyer?.email ?? "Guest checkout"}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Total</p><p className="text-xl font-bold">${money(order.total)}</p></div>
                    <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Platform fee</p><p className="text-xl font-bold">${money(order.platformFee)}</p></div>
                    <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Requested</p><p className="text-sm font-bold">{formatDate(order.refundRequestedAt)}</p></div>
                    <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Resolved</p><p className="text-sm font-bold">{formatDate(order.refundResolvedAt)}</p></div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-cream p-4">
                    <p className="font-bold">Customer reason</p>
                    <p className="mt-1 text-sm text-charcoal/70">{order.refundReason ?? "No reason provided."}</p>
                    {order.refundResolutionNote ? (
                      <>
                        <p className="mt-4 font-bold">Resolution note</p>
                        <p className="mt-1 text-sm text-charcoal/70">{order.refundResolutionNote}</p>
                      </>
                    ) : null}
                    <p className="mt-4 text-xs text-charcoal/50">Stripe/manual reference: {order.refundStripeRefundId ?? "Not recorded yet"}</p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-cream p-4">
                    <p className="font-bold">Items</p>
                    <div className="mt-2 grid gap-2 text-sm text-charcoal/70">
                      {order.items.map((item) => (
                        <p key={item.id}>{item.quantity} × {item.titleSnapshot} · ${money(item.priceSnapshot)}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {order.refundRequestStatus === RefundRequestStatus.REQUESTED ? (
                    <>
                      <form action={approveAdminRefundRequestAction} className="rounded-3xl border border-sand bg-cream p-5">
                        <input type="hidden" name="orderId" value={order.id} />
                        <p className="text-lg font-bold">Approve request</p>
                        <p className="mt-1 text-sm text-charcoal/60">Marks the order cancelled and refunded in Betsy Home. Confirm Stripe manually when needed.</p>
                        <textarea
                          name="refundResolutionNote"
                          rows={3}
                          placeholder="Admin approval note..."
                          className="mt-4 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm"
                        />
                        <button className="mt-3 w-full rounded-full bg-clay px-5 py-3 font-bold text-white">Approve refund</button>
                      </form>

                      <form action={rejectAdminRefundRequestAction} className="rounded-3xl border border-sand bg-white p-5">
                        <input type="hidden" name="orderId" value={order.id} />
                        <p className="text-lg font-bold">Reject request</p>
                        <textarea
                          name="refundResolutionNote"
                          rows={3}
                          placeholder="Reason for rejection..."
                          className="mt-4 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm"
                        />
                        <button className="mt-3 w-full rounded-full border border-clay px-5 py-3 font-bold text-clay">Reject request</button>
                      </form>
                    </>
                  ) : null}

                  {needsManualFollowUp ? (
                    <form action={markManualRefundResolvedAction} className="rounded-3xl border border-red-200 bg-red-50 p-5">
                      <input type="hidden" name="orderId" value={order.id} />
                      <p className="text-lg font-bold text-red-700">Manual refund follow-up</p>
                      <p className="mt-1 text-sm text-red-700/80">The seller approved this refund, but no Stripe refund ID is stored. Confirm the Stripe/manual refund, then record the reference here.</p>
                      <input
                        name="manualRefundReference"
                        placeholder="Stripe refund ID or manual reference"
                        className="mt-4 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm"
                      />
                      <textarea
                        name="adminNote"
                        rows={3}
                        placeholder="Admin follow-up note..."
                        className="mt-3 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm"
                      />
                      <button className="mt-3 w-full rounded-full bg-red-600 px-5 py-3 font-bold text-white">Mark follow-up resolved</button>
                    </form>
                  ) : null}

                  {order.refundRequestStatus !== RefundRequestStatus.REQUESTED && !needsManualFollowUp ? (
                    <div className="rounded-3xl border border-sand bg-cream p-5 text-sm text-charcoal/70">
                      No admin action needed for this order right now.
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
