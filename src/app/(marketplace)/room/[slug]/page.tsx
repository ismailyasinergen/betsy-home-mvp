import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { getFiltersData, getRoomProducts } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ room, products }, filters] = await Promise.all([
    getRoomProducts(slug),
    getFiltersData()
  ]);

  if (!room) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Shop by room</p>
        <h1 className="mt-2 text-4xl font-bold">{room.name}</h1>
        <p className="mt-3 text-charcoal/70">{products.length} handmade piece{products.length === 1 ? "" : "s"} curated for this space.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-3xl border border-sand bg-white p-5 shadow-sm">
            <p className="font-bold">Other rooms</p>
            <div className="mt-4 grid gap-2">
              {filters.rooms.map((item) => (
                <Link key={item.slug} href={`/room/${item.slug}`} className={item.slug === slug ? "text-sm font-bold text-clay" : "text-sm hover:text-clay"}>{item.name}</Link>
              ))}
            </div>
          </aside>

          {products.length > 0 ? (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product as any} />)}
            </section>
          ) : (
            <section className="rounded-3xl border border-sand bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">No active products yet</h2>
              <p className="mt-3 text-charcoal/70">When sellers tag products for {room.name}, they will appear here automatically.</p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
