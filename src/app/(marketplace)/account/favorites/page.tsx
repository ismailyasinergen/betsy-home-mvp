import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { removeProductFromFavoritesAction } from "@/app/(marketplace)/account/favorites/actions";
import { getCustomerFavorites } from "@/lib/favorites";

export const dynamic = "force-dynamic";

export default async function CustomerFavoritesPage() {
  const { customer, favorites } = await getCustomerFavorites();

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/account" className="text-sm font-bold text-clay">← Back to account</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Saved products</p>
            <h1 className="mt-2 text-4xl font-bold">Your favorites</h1>
            <p className="mt-2 max-w-2xl text-charcoal/70">Signed in as {customer.email}. Products saved with the heart button are stored in Supabase.</p>
          </div>
          <Link href="/search" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Find more products</Link>
        </div>

        {favorites.length > 0 ? (
          <div className="mt-8 grid gap-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {favorites.map((product) => (
                <div key={product.id} className="grid gap-3">
                  <ProductCard product={product} />
                  <form action={removeProductFromFavoritesAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm font-bold text-charcoal/70 hover:border-clay hover:text-clay">Remove from favorites</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <section className="mt-8 rounded-[2rem] border border-sand bg-white p-10 text-center shadow-sm">
            <h2 className="text-3xl font-bold">No favorites yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-charcoal/60">Click the heart button on product cards or product pages to save items here. This is the first step before mood boards.</p>
            <Link href="/search" className="mt-6 inline-flex rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Browse products</Link>
          </section>
        )}
      </main>
    </>
  );
}
