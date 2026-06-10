import { PaymentStatus, RefundRequestStatus, ShippingStatus } from "@prisma/client";
import Link from "next/link";
import { getSellerOrders } from "@/lib/orders";

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

  if (status === PaymentStatus.FAILED || status === PaymentStatus.REFUNDED) {
    return "bg-red-50 text-red-700";
  }

  return "bg-cream text-clay";
}

export default async function SellerOrdersPage() {
  const { shop, orders } = await getSellerOrders();
  const pendingValue = orders
    .filter((order) => order.paymentStatus === PaymentStatus.PENDING && order.shippingStatus !== ShippingStatus.CANCELLED)
    .reduce((sum, order) => sum + Number(order.total), 0);
  const paidValue = orders
    .filter((order) => order.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Sales</p>
          <h1 className="mt-2 text-4xl font-bold">Orders</h1>
          <p className="mt-2 text-charcoal/70">{shop ? `Showing orders for ${shop.shopName}.` : "No seller shop found."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-3xl border border-sand bg-white p-4 text-right shadow-sm">
            <p className="text-sm text-charcoal/60">Pending order value</p>
            <p className="text-2xl font-bold">{money(pendingValue)}</p>
          </div>
          <div className="rounded-3xl border border-sand bg-white p-4 text-right shadow-sm">
            <p className="text-sm text-charcoal/60">Paid order value</p>
            <p className="text-2xl font-bold">{money(paidValue)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-charcoal/70">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Shipping</th>
              <th className="p-4">Date</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-sand align-top">
                <td className="p-4">
                  <Link href={`/seller/orders/${order.id}`} className="font-bold text-charcoal hover:text-clay">{order.orderNumber}</Link>
                  <p className="mt-1 text-xs text-charcoal/55">Platform fee: {money(Number(order.platformFee))}</p>
                  {order.refundRequestStatus === RefundRequestStatus.REQUESTED ? (
                    <p className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Refund requested</p>
                  ) : order.refundRequestStatus === RefundRequestStatus.APPROVED ? (
                    <p className="mt-2 inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">Refund approved</p>
                  ) : order.refundRequestStatus === RefundRequestStatus.REJECTED ? (
                    <p className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Refund rejected</p>
                  ) : null}
                </td>
                <td className="p-4">
                  <div className="grid gap-1">
                    {order.items.map((item) => (
                      <p key={item.id}>{item.quantity} × {item.titleSnapshot}</p>
                    ))}
                  </div>
                </td>
                <td className="p-4 font-bold">{money(Number(order.total))}</td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${paymentBadgeClass(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                <td className="p-4"><span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-sage">{order.shippingStatus.replaceAll("_", " ")}</span></td>
                <td className="p-4">{formatDate(order.createdAt)}</td>
                <td className="p-4">
                  <Link href={`/seller/orders/${order.id}`} className="rounded-full border border-clay px-4 py-2 text-xs font-bold text-clay hover:bg-cream">View details</Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-charcoal/60">No orders yet. Add an item to cart, validate checkout, then create an order.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
