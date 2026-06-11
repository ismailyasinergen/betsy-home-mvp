import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { SiteHeader } from "@/components/site-header";
import { categories, products, rooms, styles } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container-page grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-clay shadow-sm">Curated handmade home marketplace</p>
            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Find handmade pieces that make your home yours.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-charcoal/70">Shop unique decor, gifts, and custom home goods from independent makers. Discover by room, style, or project.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search" className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Start Shopping</Link>
              <Link href="/sell" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Open a Shop</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </section>

        <section className="container-page py-10">
          <SectionHeader eyebrow="Discover" title="Shop by room" description="Customers can browse by the space they are decorating, not just by product category." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {rooms.map((room) => (
              <Link key={room.slug} href={`/room/${room.slug}`} className="rounded-3xl border border-sand bg-white p-5 font-semibold shadow-sm hover:text-clay">{room.name}</Link>
            ))}
          </div>
        </section>

        <section className="container-page py-10">
          <SectionHeader eyebrow="Style filters" title="Shop by style" description="Style discovery makes the marketplace feel designed for home decor and interior projects." />
          <div className="flex flex-wrap gap-3">
            {styles.map((style) => (
              <Link key={style.slug} href={`/style/${style.slug}`} className="rounded-full border border-sand bg-white px-5 py-3 font-semibold hover:border-clay hover:text-clay">{style.name}</Link>
            ))}
          </div>
        </section>

        <section className="container-page py-10">
          <SectionHeader eyebrow="Featured" title="Fresh finds for your home" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product as any} />)}
          </div>
        </section>

        <section className="container-page grid gap-6 rounded-[2rem] bg-charcoal p-8 text-white md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sand">For business buyers</p>
            <h2 className="mt-3 text-3xl font-bold">Buying for a project?</h2>
            <p className="mt-3 text-white/70">Interior designers, boutique hotels, cafes, and shops can request quotes, download seller catalogues, and build project boards.</p>
          </div>
          <div className="flex gap-3 md:justify-end">
            <Link href="/search?q=wholesale" className="rounded-full bg-white px-5 py-3 font-bold text-charcoal">Browse wholesale-ready sellers</Link>
          </div>
        </section>

        <section className="container-page py-10">
          <SectionHeader eyebrow="Categories" title="Popular categories" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} className="rounded-3xl border border-sand bg-white p-6 text-lg font-bold shadow-sm hover:text-clay">{category.name}</Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
