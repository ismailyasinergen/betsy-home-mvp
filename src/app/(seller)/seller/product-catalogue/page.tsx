import Link from "next/link";
import { createSellerCatalogue } from "@/app/(seller)/seller/product-catalogue/actions";
import { getCatalogueBuilderData, getTemplateLabel } from "@/lib/catalogue-data";

export const dynamic = "force-dynamic";

export default async function ProductCataloguePage() {
  const { shop, products, catalogues } = await getCatalogueBuilderData();

  if (!shop) {
    return (
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller growth</p>
        <h1 className="mt-2 text-4xl font-bold">No seller shop found</h1>
        <p className="mt-3 text-charcoal/70">Run npm run seed first so the demo seller shop exists.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller growth</p>
      <h1 className="mt-2 text-4xl font-bold">Create Product Catalogue</h1>
      <p className="mt-3 max-w-2xl text-charcoal/70">
        Generate a printable catalogue from active listings. In Chrome, click Print / Save as PDF on the preview page and choose “Save as PDF”.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <form action={createSellerCatalogue} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Catalogue options</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Catalogue title</span>
              <input name="catalogueTitle" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={`${shop.shopName} Product Catalogue`} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Subtitle</span>
              <input name="catalogueSubtitle" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Handmade home collection for designers and buyers" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Template</span>
              <select name="templateType" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue="CLEAN_GRID">
                <option value="CLEAN_GRID">Clean Grid Catalogue</option>
                <option value="LUXURY_LOOKBOOK">Luxury Lookbook</option>
                <option value="WHOLESALE">Wholesale Catalogue</option>
                <option value="PRICE_LIST">Simple Price List</option>
              </select>
            </label>

            <div className="grid gap-2 rounded-3xl bg-cream p-4">
              <p className="text-sm font-bold">Include in catalogue</p>
              <label className="flex gap-2"><input name="includePrices" type="checkbox" defaultChecked /> Product prices</label>
              <label className="flex gap-2"><input name="includeSku" type="checkbox" /> SKU</label>
              <label className="flex gap-2"><input name="includeStock" type="checkbox" /> Stock quantity</label>
              <label className="flex gap-2"><input name="includeQrCodes" type="checkbox" defaultChecked /> QR/link box</label>
              <label className="flex gap-2"><input name="includeShippingInfo" type="checkbox" defaultChecked /> Shipping information</label>
            </div>

            <div className="grid gap-3">
              <div>
                <p className="text-sm font-bold">Products</p>
                <p className="text-sm text-charcoal/60">Select products to include. If none are selected, all active products are included.</p>
              </div>
              <div className="grid max-h-80 gap-3 overflow-auto rounded-3xl border border-sand p-4">
                {products.length === 0 ? (
                  <p className="text-sm text-charcoal/60">No active products found. Publish at least one product first.</p>
                ) : (
                  products.map((product) => (
                    <label key={product.id} className="flex items-center gap-3 rounded-2xl border border-sand bg-white p-3">
                      <input name="productIds" type="checkbox" value={product.id} defaultChecked />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.images[0]?.imageUrl ?? "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      <span>
                        <span className="block font-semibold">{product.title}</span>
                        <span className="block text-sm text-charcoal/60">${Number(product.price).toFixed(2)} · {product.category.name}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full bg-clay px-5 py-3 font-bold text-white">Create catalogue preview</button>
          </div>
        </form>

        <aside className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Recent catalogues</h2>
          <p className="mt-2 text-sm text-charcoal/60">Open a catalogue, then use the print button to save it as a PDF.</p>
          <div className="mt-5 grid gap-3">
            {catalogues.length === 0 ? (
              <div className="rounded-3xl bg-cream p-6">
                <p className="font-bold">No catalogues yet</p>
                <p className="mt-2 text-sm text-charcoal/60">Your generated catalogues will appear here.</p>
              </div>
            ) : (
              catalogues.map((catalogue) => (
                <Link key={catalogue.id} href={`/seller/product-catalogue/${catalogue.id}`} className="rounded-3xl border border-sand p-4 hover:border-clay">
                  <span className="block font-bold">{catalogue.catalogueTitle}</span>
                  <span className="mt-1 block text-sm text-charcoal/60">{getTemplateLabel(catalogue.templateType)} · {catalogue.selectedProductIds.length} products</span>
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
