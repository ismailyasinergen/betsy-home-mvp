import type { ReactNode } from "react";
import { CurrencyPrice } from "@/components/currency-price";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCustomerOrderById } from "@/lib/customer-orders";
import { confirmDeliveryAction, requestCancellationAction } from "./actions";

export const dynamic = "force-dynamic";

type AddressPreview = {
  fullName?: string;
  line1?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
};

function money(value: number) {
  return value.toFixed(2);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getAddress(value: unknown): AddressPreview | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as AddressPreview;
}

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getCustomerOrderById(id);

  if (!order) {
    notFound();
  }

  const address = getAddress(order.shippingAddress);
  const itemTotal = order.items.reduce((sum, item) => sum + Number(item.priceSnapshot) * item.quantity, 0);
  const canConfirmDelivery = order.paymentStatus === "PAID" && order.shippingStatus === "DELIVERED" && !order.buyerConfirmedAt;
  const canReview = order.paymentStatus === "PAID" && order.shippingStatus === "DELIVERED";
  const canRequestRefund =
    order.paymentStatus !== "REFUNDED" &&
    order.shippingStatus !== "CANCELLED" &&
    !order.buyerConfirmedAt &&
    order.refundRequestStatus !== "REQUESTED" &&
    order.refundRequestStatus !== "APPROVED";
  const firstReviewTarget = order.items.find((item) => item.productId);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/account/orders" className="text-sm font-bold text-clay">← Back to orders</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Order detail</p>
            <h1 className="mt-2 text-4xl font-bold">{order.orderNumber}</h1>
            <p className="mt-2 text-charcoal/65">Ordered {formatDate(order.createdAt)} from {order.shop.shopName}</p>
          </div>
          <div className="grid gap-2 rounded-3xl border border-sand bg-white p-5 text-right shadow-sm">
            <p className="text-sm text-charcoal/60">Order total</p>
            <p className="text-3xl font-bold"><CurrencyPrice amount={Number(order.total)} /></p>
            <p className="text-sm text-charcoal/60">Payment: <span className="font-bold text-clay">{order.paymentStatus}</span></p>
            <p className="text-sm text-charcoal/60">Shipping: <span className="font-bold text-sage">{order.shippingStatus.replaceAll("_", " ")}</span></p>
            {order.buyerConfirmedAt ? <p className="text-sm font-bold text-sage">Customer confirmed delivery</p> : null}
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Order progress</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["NEW", "PROCESSING", "SHIPPED", "DELIVERED"].map((status) => {
              const isActive = order.shippingStatus === status;
              const isCancelled = order.shippingStatus === "CANCELLED";
              return (
                <div key={status} className={`rounded-3xl border p-4 ${isActive ? "border-clay bg-cream" : "border-sand bg-white"}`}>
                  <p className="font-bold">{status === "NEW" ? "Order received" : status[0] + status.slice(1).toLowerCase()}</p>
                  <p className="mt-1 text-sm text-charcoal/60">{isCancelled ? "Order cancelled" : isActive ? "Current status" : "Waiting"}</p>
                </div>
              );
            })}
          </div>
          {order.shippingStatus === "CANCELLED" ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">This order was cancelled by the seller.</p> : null}
        </section>

        {canConfirmDelivery ? (
          <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Delivery confirmation</p>
                <h2 className="mt-2 text-2xl font-bold">Did your order arrive safely?</h2>
                <p className="mt-2 text-charcoal/65">Confirm receipt after checking the package. This helps close the fulfillment loop and guides you to leave a review.</p>
              </div>
              <form action={confirmDeliveryAction} className="grid gap-3 rounded-3xl bg-cream p-4">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="text-sm font-bold" htmlFor="buyerDeliveryNote">Optional note</label>
                <textarea id="buyerDeliveryNote" name="buyerDeliveryNote" rows={3} placeholder="Everything arrived safely." className="w-full rounded-2xl border border-sand bg-white p-3 outline-none focus:border-clay" />
                <button type="submit" className="rounded-full bg-clay px-5 py-3 text-sm font-bold text-white">Confirm delivery received</button>
              </form>
            </div>
          </section>
        ) : order.buyerConfirmedAt ? (
          <section className="mt-8 rounded-3xl border border-sage/40 bg-sage/10 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-sage">Delivery confirmed</p>
                <h2 className="mt-2 text-2xl font-bold">Thanks for confirming receipt.</h2>
                <p className="mt-2 text-charcoal/65">Confirmed on {formatDate(order.buyerConfirmedAt)}.</p>
                {order.buyerDeliveryNote ? <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-charcoal/70"><strong>Your note:</strong> {order.buyerDeliveryNote}</p> : null}
              </div>
              {firstReviewTarget ? <Link href={`/account/reviews#${firstReviewTarget.id}`} className="rounded-full bg-clay px-5 py-3 text-sm font-bold text-white">Leave a review</Link> : null}
            </div>
          </section>
        ) : null}


        <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Cancellation / refund</p>
              <h2 className="mt-2 text-2xl font-bold">Need to cancel or request a refund?</h2>
              {order.refundRequestStatus === "NONE" ? (
                <p className="mt-2 text-charcoal/65">Send a request to the seller. For paid Stripe test orders, this records the refund workflow in Betsy Home; production refunds should also be confirmed in Stripe.</p>
              ) : (
                <div className="mt-3 grid gap-2 rounded-2xl bg-cream p-4 text-sm text-charcoal/70">
                  <p><strong>Status:</strong> {order.refundRequestStatus.replaceAll("_", " ")}</p>
                  {order.refundRequestedAt ? <p><strong>Requested:</strong> {formatDate(order.refundRequestedAt)}</p> : null}
                  {order.refundReason ? <p><strong>Your reason:</strong> {order.refundReason}</p> : null}
                  {order.refundResolutionNote ? <p><strong>Seller note:</strong> {order.refundResolutionNote}</p> : null}
                  {order.refundResolvedAt ? <p><strong>Resolved:</strong> {formatDate(order.refundResolvedAt)}</p> : null}
                </div>
              )}
            </div>

            {canRequestRefund ? (
              <form action={requestCancellationAction} className="grid gap-3 rounded-3xl bg-cream p-4">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="text-sm font-bold" htmlFor="refundReason">Request reason</label>
                <textarea id="refundReason" name="refundReason" required rows={4} placeholder="Please cancel this order because..." className="w-full rounded-2xl border border-sand bg-white p-3 outline-none focus:border-clay" />
                <button type="submit" className="rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-50">Request cancellation / refund</button>
              </form>
            ) : order.refundRequestStatus === "REQUESTED" ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Your request is waiting for seller review.</div>
            ) : order.refundRequestStatus === "APPROVED" ? (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">The seller approved this refund/cancellation request.</div>
            ) : order.refundRequestStatus === "REJECTED" ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">The seller reviewed and rejected this request.</div>
            ) : (
              <div className="rounded-3xl bg-cream p-4 text-sm text-charcoal/65">Requests are disabled after delivery is confirmed, after refund approval, or when the order is already cancelled.</div>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Items</h2>
            <div className="mt-5 grid gap-4">
              {order.items.map((item) => (
                <article key={item.id} className="grid gap-4 rounded-3xl bg-cream p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl bg-sand">
                    {item.product?.images[0]?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0].imageUrl} alt={item.titleSnapshot} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-bold">{item.titleSnapshot}</p>
                    <p className="mt-1 text-sm text-charcoal/60">Quantity: {item.quantity}</p>
                    {item.personalizationText ? (
                      <p className="mt-2 rounded-2xl bg-white p-3 text-sm text-charcoal/70"><strong>Personalization:</strong> {item.personalizationText}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {item.product?.slug ? (
                        <Link href={`/product/${item.product.slug}`} className="inline-flex text-sm font-bold text-clay">View product page</Link>
                      ) : null}
                      {canReview && item.productId ? (
                        <Link href={`/account/reviews#${item.id}`} className="inline-flex text-sm font-bold text-sage">Leave or edit review</Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{money(Number(item.priceSnapshot) * item.quantity)}</p>
                    <p className="text-sm text-charcoal/55"><CurrencyPrice amount={Number(item.priceSnapshot)} /> each</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid gap-6 self-start">
            <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Shipping address</h2>
              {address ? (
                <div className="mt-4 text-charcoal/70">
                  <p className="font-semibold text-charcoal">{address.fullName ?? "Demo Customer"}</p>
                  <p>{address.line1}</p>
                  <p>{address.postalCode} {address.city}</p>
                  <p>{address.countryName ?? address.countryCode}</p>
                </div>
              ) : (
                <p className="mt-4 text-charcoal/60">No shipping address saved.</p>
              )}
            </section>

            <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Tracking</h2>
              {order.trackingCarrier || order.trackingNumber || order.trackingUrl || order.shippingNote ? (
                <div className="mt-4 grid gap-3 text-sm text-charcoal/70">
                  {order.trackingCarrier ? <p><span className="font-bold text-charcoal">Carrier:</span> {order.trackingCarrier}</p> : null}
                  {order.trackingNumber ? <p><span className="font-bold text-charcoal">Tracking number:</span> {order.trackingNumber}</p> : null}
                  {order.shippingNote ? <p className="rounded-2xl bg-cream p-3"><span className="font-bold text-charcoal">Seller note:</span> {order.shippingNote}</p> : null}
                  {order.trackingUrl ? (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex justify-center rounded-full bg-clay px-4 py-2 text-sm font-bold text-white">Track package</a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-charcoal/60">Tracking details will appear here when the seller ships your order.</p>
              )}
            </section>

            <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Payment summary</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Items</dt><dd className="font-semibold"><CurrencyPrice amount={Number(itemTotal ?? 0)} /></dd></div>
                <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Shipping</dt><dd className="font-semibold"><CurrencyPrice amount={Number(order.shippingTotal)} /></dd></div>
                <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Tax</dt><dd className="font-semibold"><CurrencyPrice amount={Number(order.taxTotal)} /></dd></div>
                <div className="border-t border-sand pt-3 flex justify-between gap-4 text-base"><dt className="font-bold">Total</dt><dd className="font-bold"><CurrencyPrice amount={Number(order.total)} /></dd></div>
              </dl>
            </section>

            <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Need help?</h2>
              <p className="mt-2 text-sm text-charcoal/60">Message the seller about shipping, personalization, or order questions.</p>
              <Link href={`/account/messages/${order.shop.id}`} className="mt-4 inline-flex rounded-full border border-clay px-4 py-2 text-sm font-bold text-clay">Contact seller</Link>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
