import Link from "next/link";
import { PaymentStatus, ShippingStatus } from "@prisma/client";
import { SiteHeader } from "@/components/site-header";
import { getCustomerOrders } from "@/lib/customer-orders";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function paymentBadgeClass(status: string) {
  if (status === PaymentStatus.PAID) {
    return "bg-green-50 text-green-700";
  }

  if (([PaymentStatus.FAILED, PaymentStatus.REFUNDED, PaymentStatus.DISPUTED] as PaymentStatus[]).includes(status as PaymentStatus)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-cream text-clay";
}

function shippingBadgeClass(status: string) {
  if (status === ShippingStatus.DELIVERED) {
    return "bg-green-50 text-green-700";
  }

  if (status === ShippingStatus.CANCELLED) {
    return "bg-red-50 text-red-700";
  }

  return "bg-cream text-sage";
}

export default async function CustomerOrdersPage() {
  const { customer, orders } = await getCustomerOrders();
  const paidValue = orders
    .filter((order) => order.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, order) => sum + Number(order.total), 0);
  const pendingValue = orders
    .filter((order) => order.paymentStatus === PaymentStatus.PENDING)
    .reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/account" className="text-sm font-bold text-clay">← Back to account</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Order history</p>
            <h1 className="mt-2 text-4xl font-bold">Your orders</h1>
            <p className="mt-2 max-w-2xl text-charcoal/70">Signed-in customer order history. Orders are stored in Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-3xl border border-sand bg-white p-4 text-right shadow-sm">
              <p className="text-sm text-charcoal/60">Paid order value</p>
              <p className="text-2xl font-bold">{money(paidValue)}</p>
            </div>
            <div className="rounded-3xl border border-sand bg-white p-4 text-right shadow-sm">
              <p className="text-sm text-charcoal/60">Pending order value</p>
              <p className="text-2xl font-bold">{money(pendingValue)}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/account/orders/${order.id}`} className="text-xl font-bold hover:text-clay">{order.orderNumber}</Link>
                  <p className="mt-1 text-sm text-charcoal/60">Seller: {order.shop.shopName} · Ordered {formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{money(Number(order.total))}</p>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${paymentBadgeClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${shippingBadgeClass(order.shippingStatus)}`}>{order.shippingStatus.replaceAll("_", " ")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-charcoal/70">
                {order.items.map((item) => (
                  <p key={item.id}>{item.quantity} × {item.titleSnapshot} · {money(Number(item.priceSnapshot) * item.quantity)}</p>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/account/orders/${order.id}`} className="rounded-full bg-clay px-5 py-2 text-sm font-bold text-white">View order details</Link>
                <Link href="/search" className="rounded-full border border-clay px-5 py-2 text-sm font-bold text-clay">Continue shopping</Link>
              </div>
            </article>
          ))}

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-sand bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold">No orders yet</h2>
              <p className="mt-2 text-charcoal/60">Add a product to cart, validate checkout, and create a demo order.</p>
              <Link href="/search" className="mt-5 inline-flex rounded-full bg-clay px-5 py-3 font-bold text-white">Start shopping</Link>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
