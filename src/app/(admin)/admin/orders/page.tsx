import { PaymentStatus, ShippingStatus } from "@prisma/client";
import { getAdminOrders } from "@/lib/admin-data";
import { updateAdminOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Orders</h1>
      <p className="mt-3 text-charcoal/70">Monitor marketplace orders and manually adjust demo statuses when needed.</p>

      <div className="mt-8 grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{order.paymentStatus}</span>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{order.shippingStatus}</span>
                </div>
                <p className="mt-2 text-sm text-charcoal/60">Seller: {order.shop.shopName} · Buyer: {order.buyer?.email ?? "Guest checkout"}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Subtotal</p><p className="text-xl font-bold">${Number(order.subtotal).toFixed(2)}</p></div>
                  <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Shipping</p><p className="text-xl font-bold">${Number(order.shippingTotal).toFixed(2)}</p></div>
                  <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Platform fee</p><p className="text-xl font-bold">${Number(order.platformFee).toFixed(2)}</p></div>
                  <div className="rounded-2xl bg-cream p-3"><p className="text-sm text-charcoal/60">Total</p><p className="text-xl font-bold">${Number(order.total).toFixed(2)}</p></div>
                </div>
                <div className="mt-4 rounded-2xl bg-cream p-4">
                  <p className="font-bold">Items</p>
                  <div className="mt-2 grid gap-2 text-sm text-charcoal/70">
                    {order.items.map((item) => (
                      <p key={item.id}>{item.quantity} × {item.titleSnapshot} · ${Number(item.priceSnapshot).toFixed(2)}</p>
                    ))}
                  </div>
                </div>
              </div>

              <form action={updateAdminOrderStatus} className="grid min-w-72 gap-3 rounded-2xl bg-cream p-4">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="text-sm font-bold">Payment status</label>
                <select name="paymentStatus" defaultValue={order.paymentStatus} className="rounded-2xl border border-sand bg-white px-4 py-3">
                  {Object.values(PaymentStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <label className="text-sm font-bold">Shipping status</label>
                <select name="shippingStatus" defaultValue={order.shippingStatus} className="rounded-2xl border border-sand bg-white px-4 py-3">
                  {Object.values(ShippingStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button className="rounded-full bg-clay px-5 py-3 font-bold text-white">Save order status</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
