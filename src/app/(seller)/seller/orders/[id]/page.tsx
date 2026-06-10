import Link from "next/link";
import { ShippingStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { getSellerOrderById } from "@/lib/orders";
import { approveRefundRequestAction, rejectRefundRequestAction, updateOrderShippingStatusAction, updateOrderTrackingAction } from "./actions";

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
  return `$${value.toFixed(2)}`;
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

function StatusButton({ orderId, status, label, currentStatus }: { orderId: string; status: ShippingStatus; label: string; currentStatus: ShippingStatus }) {
  const isCurrent = status === currentStatus;

  return (
    <form action={updateOrderShippingStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="shippingStatus" value={status} />
      <button
        type="submit"
        disabled={isCurrent}
        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
          isCurrent
            ? "cursor-not-allowed bg-sand text-charcoal/45"
            : status === ShippingStatus.CANCELLED
              ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
              : "border border-clay bg-white text-clay hover:bg-cream"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function TrackingField({ label, name, defaultValue, placeholder, type = "text" }: { label: string; name: string; defaultValue?: string | null; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-charcoal">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-base font-normal outline-none transition focus:border-clay"
      />
    </label>
  );
}

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order } = await getSellerOrderById(id);

  if (!order) {
    notFound();
  }

  const address = getAddress(order.shippingAddress);
  const itemTotal = order.items.reduce((sum, item) => sum + Number(item.priceSnapshot) * item.quantity, 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/seller/orders" className="text-sm font-bold text-clay">← Back to orders</Link>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Order detail</p>
          <h1 className="mt-2 text-4xl font-bold">{order.orderNumber}</h1>
          <p className="mt-2 text-charcoal/65">Created {formatDate(order.createdAt)}</p>
        </div>
        <div className="grid gap-2 rounded-3xl border border-sand bg-white p-5 text-right shadow-sm">
          <p className="text-sm text-charcoal/60">Order total</p>
          <p className="text-3xl font-bold">{money(Number(order.total))}</p>
          <p className="text-sm text-charcoal/60">Payment: <span className="font-bold text-clay">{order.paymentStatus}</span></p>
          <p className="text-sm text-charcoal/60">Shipping: <span className="font-bold text-sage">{order.shippingStatus.replaceAll("_", " ")}</span></p>
          {order.buyerConfirmedAt ? <p className="text-sm font-bold text-sage">Buyer confirmed receipt</p> : null}
          {order.buyerId ? (
            <Link href={`/seller/messages/${order.buyerId}`} className="mt-2 rounded-full border border-clay px-4 py-2 text-center text-sm font-bold text-clay">Message customer</Link>
          ) : null}
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Update shipping status</h2>
            <p className="mt-1 text-sm text-charcoal/60">Use status updates for fulfillment. Add tracking details below when the parcel ships.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusButton orderId={order.id} status={ShippingStatus.PROCESSING} label="Mark as Processing" currentStatus={order.shippingStatus} />
            <StatusButton orderId={order.id} status={ShippingStatus.SHIPPED} label="Mark as Shipped" currentStatus={order.shippingStatus} />
            <StatusButton orderId={order.id} status={ShippingStatus.DELIVERED} label="Mark as Delivered" currentStatus={order.shippingStatus} />
            <StatusButton orderId={order.id} status={ShippingStatus.CANCELLED} label="Cancel Order" currentStatus={order.shippingStatus} />
          </div>
        </div>
      </section>

      {order.buyerConfirmedAt ? (
        <section className="mt-8 rounded-3xl border border-sage/40 bg-sage/10 p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sage">Buyer confirmation</p>
          <h2 className="mt-2 text-2xl font-bold">The customer confirmed this delivery.</h2>
          <p className="mt-2 text-charcoal/65">Confirmed on {formatDate(order.buyerConfirmedAt)}.</p>
          {order.buyerDeliveryNote ? <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-charcoal/70"><strong>Customer note:</strong> {order.buyerDeliveryNote}</p> : null}
        </section>
      ) : null}


      <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Cancellation / refund</p>
            <h2 className="mt-2 text-2xl font-bold">Refund request status</h2>
            {order.refundRequestStatus === "NONE" ? (
              <p className="mt-2 text-charcoal/60">No cancellation or refund request for this order.</p>
            ) : (
              <div className="mt-3 grid gap-2 rounded-2xl bg-cream p-4 text-sm text-charcoal/70">
                <p><strong>Status:</strong> {order.refundRequestStatus.replaceAll("_", " ")}</p>
                {order.refundRequestedAt ? <p><strong>Requested:</strong> {formatDate(order.refundRequestedAt)}</p> : null}
                {order.refundReason ? <p><strong>Customer reason:</strong> {order.refundReason}</p> : null}
                {order.refundResolutionNote ? <p><strong>Resolution note:</strong> {order.refundResolutionNote}</p> : null}
                {order.refundStripeRefundId ? <p><strong>Stripe refund:</strong> {order.refundStripeRefundId}</p> : null}
                {order.refundResolvedAt ? <p><strong>Resolved:</strong> {formatDate(order.refundResolvedAt)}</p> : null}
              </div>
            )}
          </div>

          {order.refundRequestStatus === "REQUESTED" ? (
            <div className="grid w-full gap-4 lg:w-[420px]">
              <form action={approveRefundRequestAction} className="grid gap-3 rounded-3xl border border-green-200 bg-green-50 p-4">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="text-sm font-bold" htmlFor="approveRefundNote">Approval note</label>
                <textarea id="approveRefundNote" name="refundResolutionNote" rows={3} placeholder="Approved. We will cancel/refund this order." className="w-full rounded-2xl border border-green-200 bg-white p-3 outline-none focus:border-green-500" />
                <button type="submit" className="rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white">Approve refund / cancel order</button>
              </form>

              <form action={rejectRefundRequestAction} className="grid gap-3 rounded-3xl border border-red-200 bg-red-50 p-4">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="text-sm font-bold" htmlFor="rejectRefundNote">Rejection note</label>
                <textarea id="rejectRefundNote" name="refundResolutionNote" rows={3} placeholder="We cannot cancel because the order has already shipped." className="w-full rounded-2xl border border-red-200 bg-white p-3 outline-none focus:border-red-500" />
                <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-red-700 ring-1 ring-red-200">Reject request</button>
              </form>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Tracking details</h2>
            <p className="mt-1 text-sm text-charcoal/60">Add carrier and tracking information so the customer can follow the shipment from their account.</p>
          </div>
          {order.trackingNumber ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Tracking saved</span>
          ) : (
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">No tracking yet</span>
          )}
        </div>

        <form action={updateOrderTrackingAction} className="mt-5 grid gap-4">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <TrackingField label="Carrier" name="trackingCarrier" defaultValue={order.trackingCarrier} placeholder="DHL, UPS, FedEx, Royal Mail..." />
            <TrackingField label="Tracking number" name="trackingNumber" defaultValue={order.trackingNumber} placeholder="Example: 1Z999AA10123456784" />
          </div>
          <TrackingField label="Tracking URL" name="trackingUrl" type="url" defaultValue={order.trackingUrl} placeholder="https://..." />
          <label className="grid gap-2 text-sm font-bold text-charcoal">
            Shipping note for customer
            <textarea
              name="shippingNote"
              defaultValue={order.shippingNote ?? ""}
              placeholder="Your parcel has been packed carefully and handed to the carrier."
              className="min-h-28 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-base font-normal outline-none transition focus:border-clay"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-charcoal/75">
            <input type="checkbox" name="markAsShipped" defaultChecked={order.shippingStatus !== ShippingStatus.DELIVERED && Boolean(order.trackingNumber)} />
            Mark order as shipped when saving tracking details
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Save tracking details</button>
            {order.trackingUrl ? (
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Open tracking link</a>
            ) : null}
          </div>
        </form>
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
                  ) : (
                    <p className="mt-1 text-sm text-charcoal/45">No personalization note.</p>
                  )}
                  {item.product?.slug ? (
                    <Link href={`/product/${item.product.slug}`} className="mt-2 inline-flex text-sm font-bold text-clay">View product page</Link>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-bold">{money(Number(item.priceSnapshot) * item.quantity)}</p>
                  <p className="text-sm text-charcoal/55">{money(Number(item.priceSnapshot))} each</p>
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
            <h2 className="text-xl font-bold">Payment summary</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Items</dt><dd className="font-semibold">{money(itemTotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Shipping</dt><dd className="font-semibold">{money(Number(order.shippingTotal))}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Tax</dt><dd className="font-semibold">{money(Number(order.taxTotal))}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Platform fee</dt><dd className="font-semibold">{money(Number(order.platformFee))}</dd></div>
              <div className="border-t border-sand pt-3 flex justify-between gap-4 text-base"><dt className="font-bold">Total</dt><dd className="font-bold">{money(Number(order.total))}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
