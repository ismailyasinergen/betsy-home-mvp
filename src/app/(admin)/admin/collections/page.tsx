import { ProductStatus } from "@prisma/client";
import { getAdminCollectionsData } from "@/lib/admin-data";
import { addProductToCollection, createCollection, removeProductFromCollection, updateCollectionStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const { collections, activeProducts } = await getAdminCollectionsData();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Homepage collections</h1>
      <p className="mt-3 text-charcoal/70">Create curated product collections for campaigns, SEO, and homepage merchandising.</p>

      <form action={createCollection} className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Create or update collection</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <input name="title" placeholder="Collection title, e.g. Cozy Bedroom Finds" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          <input name="description" placeholder="Short description" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          <input name="imageUrl" placeholder="Optional image URL" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
        </div>
        <button className="mt-4 rounded-full bg-clay px-6 py-3 font-bold text-white">Save collection</button>
      </form>

      <div className="mt-8 grid gap-6">
        {collections.map((collection) => (
          <article key={collection.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">{collection.title}</h2>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{collection.status}</span>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-charcoal/70">{collection._count.products} products</span>
                </div>
                <p className="mt-2 text-charcoal/70">{collection.description ?? "No description yet."}</p>
              </div>
              <form action={updateCollectionStatus} className="flex gap-2">
                <input type="hidden" name="collectionId" value={collection.id} />
                <select name="status" defaultValue={collection.status} className="rounded-2xl border border-sand bg-cream px-4 py-3">
                  {Object.values(ProductStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button className="rounded-full bg-charcoal px-5 py-3 font-bold text-white">Save</button>
              </form>
            </div>

            <form action={addProductToCollection} className="mt-5 grid gap-3 rounded-2xl bg-cream p-4 lg:grid-cols-[1fr_auto]">
              <input type="hidden" name="collectionId" value={collection.id} />
              <select name="productId" className="rounded-2xl border border-sand bg-white px-4 py-3">
                {activeProducts.map((product) => <option key={product.id} value={product.id}>{product.title} · {product.shop.shopName}</option>)}
              </select>
              <button className="rounded-full bg-clay px-5 py-3 font-bold text-white">Add product</button>
            </form>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {collection.products.map((item) => (
                <div key={item.id} className="rounded-2xl bg-cream p-3">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.product.images[0]?.imageUrl ?? "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"} alt={item.product.title} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-3 font-bold">{item.product.title}</p>
                  <p className="text-sm text-charcoal/60">{item.product.shop.shopName}</p>
                  <form action={removeProductFromCollection} className="mt-3">
                    <input type="hidden" name="collectionProductId" value={item.id} />
                    <button className="text-sm font-bold text-red-700">Remove</button>
                  </form>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
