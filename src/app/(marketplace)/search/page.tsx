import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { getFiltersData, getSearchProducts } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const [products, filters] = await Promise.all([
    getSearchProducts(query),
    getFiltersData()
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Search</p>
            <h1 className="mt-2 text-4xl font-bold">
              {query ? `Search results for “${query}”` : "Explore handmade home goods"}
            </h1>
            <p className="mt-3 text-charcoal/70">{products.length} product{products.length === 1 ? "" : "s"} loaded from the database.</p>
          </div>
          <form action="/search" className="flex w-full max-w-xl gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search ceramics, wall art, candles..."
              className="min-w-0 flex-1 rounded-full border border-sand bg-white px-5 py-3 outline-none focus:border-clay"
            />
            <button className="rounded-full bg-clay px-6 py-3 font-bold text-white">Search</button>
          </form>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-sand bg-white p-5 shadow-sm">
            <p className="font-bold">Browse filters</p>

            <div className="mt-5">
              <p className="text-sm font-bold text-charcoal/70">Categories</p>
              <div className="mt-3 grid gap-2">
                {filters.categories.map((category) => (
                  <Link key={category.slug} href={`/category/${category.slug}`} className="text-sm hover:text-clay">{category.name}</Link>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold text-charcoal/70">Rooms</p>
              <div className="mt-3 grid gap-2">
                {filters.rooms.map((room) => (
                  <Link key={room.slug} href={`/room/${room.slug}`} className="text-sm hover:text-clay">{room.name}</Link>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold text-charcoal/70">Styles</p>
              <div className="mt-3 grid gap-2">
                {filters.styles.map((style) => (
                  <Link key={style.slug} href={`/style/${style.slug}`} className="text-sm hover:text-clay">{style.name}</Link>
                ))}
              </div>
            </div>
          </aside>

          {products.length > 0 ? (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product as any} />)}
            </section>
          ) : (
            <section className="rounded-3xl border border-sand bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">No products found</h2>
              <p className="mt-3 text-charcoal/70">Try a broader search like “ceramic”, “wall art”, “candle”, or browse by room and style.</p>
              <Link href="/search" className="mt-6 inline-flex rounded-full bg-clay px-6 py-3 font-bold text-white">View all products</Link>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
