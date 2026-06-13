import type { ReactNode } from "react";
import { CurrencyPrice } from "@/components/currency-price";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import { getAdminProducts } from "@/lib/admin-data";
import { updateProductStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Products</h1>
      <p className="mt-3 text-charcoal/70">Moderate marketplace listings and control visibility.</p>

      <div className="mt-8 grid gap-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[140px_1fr_auto] lg:items-start">
              <div className="aspect-square overflow-hidden rounded-2xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]?.imageUrl ?? "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"} alt={product.title} className="h-full w-full object-cover" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">{product.title}</h2>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{product.status}</span>
                  {!product.shippingProfile ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Missing shipping</span> : null}
                </div>
                <p className="mt-2 text-sm text-charcoal/60">{product.shop.shopName} · {product.category.name} · <CurrencyPrice amount={Number(product.salePrice ?? product.price)} /></p>
                <p className="mt-3 line-clamp-2 text-charcoal/70">{product.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-charcoal/70">
                  <span className="rounded-full bg-cream px-3 py-1">Stock: {product.quantity}</span>
                  <span className="rounded-full bg-cream px-3 py-1">Reviews: {product._count.reviews}</span>
                  <span className="rounded-full bg-cream px-3 py-1">Favorites: {product._count.favorites}</span>
                  <span className="rounded-full bg-cream px-3 py-1">Sold items: {product._count.orderItems}</span>
                </div>
                <Link href={`/product/${product.slug}`} className="mt-4 inline-flex text-sm font-bold text-clay">View public page</Link>
              </div>

              <form action={updateProductStatus} className="grid min-w-60 gap-2 rounded-2xl bg-cream p-4">
                <input type="hidden" name="productId" value={product.id} />
                <label className="text-sm font-bold">Update product status</label>
                <select name="status" defaultValue={product.status} className="rounded-2xl border border-sand bg-white px-4 py-3">
                  {Object.values(ProductStatus).map((status) => <option key={status} value={status}>{status}</option>)}
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
