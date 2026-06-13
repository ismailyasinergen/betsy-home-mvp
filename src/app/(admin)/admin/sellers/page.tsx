import type { ReactNode } from "react";
import { CurrencyPrice } from "@/components/currency-price";
import { ShopStatus } from "@prisma/client";
import { getAdminSellers } from "@/lib/admin-data";
import { updateShopStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const shops = await getAdminSellers();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Sellers</h1>
      <p className="mt-3 text-charcoal/70">Approve, suspend, or review seller shops.</p>

      <div className="mt-8 grid gap-4">
        {shops.map((shop) => (
          <article key={shop.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">{shop.shopName}</h2>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{shop.status}</span>
                </div>
                <p className="mt-2 text-sm text-charcoal/60">Seller: {shop.seller.email}</p>
                <p className="mt-2 max-w-3xl text-charcoal/70">{shop.description ?? "No shop description yet."}</p>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                  <div className="rounded-2xl bg-cream p-3"><p className="text-charcoal/60">Products</p><p className="text-xl font-bold">{shop._count.products}</p></div>
                  <div className="rounded-2xl bg-cream p-3"><p className="text-charcoal/60">Orders</p><p className="text-xl font-bold">{shop._count.orders}</p></div>
                  <div className="rounded-2xl bg-cream p-3"><p className="text-charcoal/60">Reviews</p><p className="text-xl font-bold">{shop._count.reviews}</p></div>
                  <div className="rounded-2xl bg-cream p-3"><p className="text-charcoal/60">Paid revenue</p><p className="text-xl font-bold"><CurrencyPrice amount={Number(shop.paidRevenue)} /></p></div>
                </div>
              </div>

              <form action={updateShopStatus} className="grid gap-2 rounded-2xl bg-cream p-4">
                <input type="hidden" name="shopId" value={shop.id} />
                <label className="text-sm font-bold">Update shop status</label>
                <select name="status" defaultValue={shop.status} className="rounded-2xl border border-sand bg-white px-4 py-3">
                  {Object.values(ShopStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button className="rounded-full bg-clay px-5 py-3 font-bold text-white">Save status</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
