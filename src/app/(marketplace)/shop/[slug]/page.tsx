import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { products } from "@/lib/mock-data";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <section className="overflow-hidden rounded-[2rem] border border-sand bg-white shadow-sm">
          <div className="h-44 bg-gradient-to-r from-clay to-sage" />
          <div className="p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Verified handmade seller</p>
            <h1 className="mt-2 text-4xl font-bold capitalize">{slug.replaceAll('-', ' ')}</h1>
            <p className="mt-3 max-w-3xl text-charcoal/70">A seller storefront with shop story, announcements, policies, reviews, and products.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-full bg-clay px-5 py-3 font-bold text-white">Contact seller</button>
              <button className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Download PDF catalogue</button>
            </div>
          </div>
        </section>
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      </main>
    </>
  );
}
