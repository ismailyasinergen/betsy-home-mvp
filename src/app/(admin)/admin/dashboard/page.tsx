import type { ReactNode } from "react";
import { CurrencyPrice } from "@/components/currency-price";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { getAdminDashboardData } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Platform dashboard</h1>
      <p className="mt-3 text-charcoal/70">Real-time overview of Betsy Home marketplace activity.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending sellers" value={String(data.pendingSellers)} helper="Needs review" />
        <StatCard label="Products live" value={String(data.productsLive)} helper={`${data.productsNeedReview} need moderation`} />
        <StatCard label="Paid GMV" value={<CurrencyPrice amount={Number(data.grossMerchandiseValue)} />} helper={<span>Fees: <CurrencyPrice amount={Number(data.platformFees)} /></span>} />
        <StatCard label="Pending payments" value={String(data.pendingPayments)} helper={`${data.paidOrders} paid orders`} />
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Admin priorities</h2>
            <Link href="/admin/reports" className="text-sm font-bold text-clay">View reports</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Link href="/admin/sellers" className="rounded-2xl bg-cream p-4 font-semibold">Approve seller shops: {data.pendingSellers}</Link>
            <Link href="/admin/products" className="rounded-2xl bg-cream p-4 font-semibold">Moderate products: {data.productsNeedReview}</Link>
            <Link href="/admin/orders" className="rounded-2xl bg-cream p-4 font-semibold">Review open orders: {data.orders}</Link>
            <Link href="/admin/payments" className="rounded-2xl bg-cream p-4 font-semibold">Pending payments: {data.pendingPayments}</Link>
            <Link href="/seller/custom-requests" className="rounded-2xl bg-cream p-4 font-semibold">Open custom requests: {data.openCustomRequests}</Link>
            <Link href="/seller/reviews" className="rounded-2xl bg-cream p-4 font-semibold">Unanswered reviews: {data.unansweredReviews}</Link>
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Platform users</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-cream p-4"><p className="text-sm text-charcoal/60">Total users</p><p className="text-3xl font-bold">{data.users}</p></div>
            <div className="rounded-2xl bg-cream p-4"><p className="text-sm text-charcoal/60">Seller shops</p><p className="text-3xl font-bold">{data.sellers}</p></div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Recent orders</h2>
          <div className="mt-4 grid gap-3">
            {data.recentOrders.map((order) => (
              <Link key={order.id} href="/admin/orders" className="rounded-2xl bg-cream p-4 text-sm">
                <p className="font-bold">{order.orderNumber}</p>
                <p className="text-charcoal/60">{order.shop.shopName} · <CurrencyPrice amount={Number(order.total)} /></p>
                <p className="mt-1 text-xs font-bold text-clay">{order.paymentStatus} / {order.shippingStatus}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Recent products</h2>
          <div className="mt-4 grid gap-3">
            {data.recentProducts.map((product) => (
              <Link key={product.id} href="/admin/products" className="rounded-2xl bg-cream p-4 text-sm">
                <p className="font-bold">{product.title}</p>
                <p className="text-charcoal/60">{product.shop.shopName} · {product.category.name}</p>
                <p className="mt-1 text-xs font-bold text-clay">{product.status}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Recent shops</h2>
          <div className="mt-4 grid gap-3">
            {data.recentShops.map((shop) => (
              <Link key={shop.id} href="/admin/sellers" className="rounded-2xl bg-cream p-4 text-sm">
                <p className="font-bold">{shop.shopName}</p>
                <p className="text-charcoal/60">{shop.seller.email} · {shop._count.products} products</p>
                <p className="mt-1 text-xs font-bold text-clay">{shop.status}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
