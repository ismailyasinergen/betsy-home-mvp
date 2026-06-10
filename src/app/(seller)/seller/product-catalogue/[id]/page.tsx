import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintCatalogueButton } from "@/components/print-catalogue-button";
import { getCataloguePreviewData, getTemplateLabel } from "@/lib/catalogue-data";

export const dynamic = "force-dynamic";

export default async function CataloguePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCataloguePreviewData(id);

  if (!data) {
    notFound();
  }

  const { catalogue, shop, products } = data;
  const isPriceList = catalogue.templateType === "PRICE_LIST";
  const isLuxury = catalogue.templateType === "LUXURY_LOOKBOOK";
  const isWholesale = catalogue.templateType === "WHOLESALE";

  return (
    <div className="bg-white text-charcoal print:bg-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/seller/product-catalogue" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Back to catalogue builder</Link>
        <PrintCatalogueButton />
      </div>

      <article className="mx-auto max-w-5xl rounded-[2rem] border border-sand bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="grid gap-6 border-b border-sand pb-8 md:grid-cols-[1fr_220px] md:items-end print:grid-cols-[1fr_180px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-clay">Betsy Home Seller Studio</p>
            <h1 className="mt-4 text-5xl font-bold tracking-tight print:text-4xl">{catalogue.catalogueTitle}</h1>
            {catalogue.catalogueSubtitle ? <p className="mt-3 text-lg text-charcoal/70">{catalogue.catalogueSubtitle}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-charcoal/60">
              <span className="rounded-full bg-cream px-3 py-1">{shop.shopName}</span>
              <span className="rounded-full bg-cream px-3 py-1">{getTemplateLabel(catalogue.templateType)}</span>
              <span className="rounded-full bg-cream px-3 py-1">{products.length} products</span>
            </div>
          </div>
          <div className="rounded-3xl bg-cream p-5 text-sm text-charcoal/70">
            <p className="font-bold text-charcoal">Shop information</p>
            {shop.location ? <p className="mt-2">Location: {shop.location}</p> : null}
            <p className="mt-2">Rating: ★ {shop.rating}</p>
            <p className="mt-2">Sales: {shop.totalSales}</p>
          </div>
        </header>

        {products.length === 0 ? (
          <section className="py-12">
            <h2 className="text-2xl font-bold">No products in this catalogue</h2>
            <p className="mt-2 text-charcoal/60">Go back and select active products.</p>
          </section>
        ) : isPriceList ? (
          <section className="mt-8 overflow-hidden rounded-3xl border border-sand print:rounded-none">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-cream">
                <tr>
                  <th className="p-3">Product</th>
                  {catalogue.includeSku ? <th className="p-3">SKU</th> : null}
                  {catalogue.includePrices ? <th className="p-3">Price</th> : null}
                  {catalogue.includeStock ? <th className="p-3">Stock</th> : null}
                  <th className="p-3">Category</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-sand">
                    <td className="p-3 font-semibold">{product.title}</td>
                    {catalogue.includeSku ? <td className="p-3">{product.sku ?? "—"}</td> : null}
                    {catalogue.includePrices ? <td className="p-3">${Number(product.price).toFixed(2)}</td> : null}
                    {catalogue.includeStock ? <td className="p-3">{product.quantity}</td> : null}
                    <td className="p-3">{product.category.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className={isLuxury ? "mt-8 grid gap-8" : "mt-8 grid gap-6 md:grid-cols-2"}>
            {products.map((product) => {
              const productUrl = `/product/${product.slug}`;
              return (
                <article key={product.id} className={isLuxury ? "grid break-inside-avoid gap-6 rounded-[2rem] border border-sand p-5 md:grid-cols-[1.1fr_0.9fr] print:grid-cols-[1fr_1fr]" : "break-inside-avoid overflow-hidden rounded-[2rem] border border-sand"}>
                  <div className="flex items-center justify-center bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.images[0]?.imageUrl ?? "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"} alt={product.title} className={isLuxury ? "max-h-[460px] w-full rounded-[1.5rem] object-contain" : "aspect-[4/3] w-full object-cover"} />
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay">{product.category.name}</p>
                    <h2 className="mt-2 text-2xl font-bold">{product.title}</h2>
                    {catalogue.includePrices ? <p className="mt-3 text-2xl font-bold">${Number(product.price).toFixed(2)}</p> : null}
                    <p className="mt-3 text-sm leading-6 text-charcoal/70">{product.description}</p>
                    <div className="mt-4 grid gap-2 text-sm text-charcoal/70">
                      {catalogue.includeSku ? <p><strong>SKU:</strong> {product.sku ?? "—"}</p> : null}
                      {catalogue.includeStock ? <p><strong>Stock:</strong> {product.quantity}</p> : null}
                      {product.dimensions ? <p><strong>Dimensions:</strong> {product.dimensions}</p> : null}
                      {product.materials.length > 0 ? <p><strong>Materials:</strong> {product.materials.join(", ")}</p> : null}
                      {isWholesale && product.bestFor.length > 0 ? <p><strong>Best for:</strong> {product.bestFor.join(", ")}</p> : null}
                      {catalogue.includeShippingInfo && product.shippingProfile?.estimatedDeliveryText ? <p><strong>Shipping:</strong> {product.shippingProfile.estimatedDeliveryText}</p> : null}
                    </div>
                    {catalogue.includeQrCodes ? (
                      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-cream p-3 text-xs text-charcoal/70">
                        <div className="grid h-16 w-16 place-items-center rounded-xl border-2 border-charcoal bg-white font-black">QR</div>
                        <div>
                          <p className="font-bold text-charcoal">Product link</p>
                          <p>{productUrl}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="mt-10 border-t border-sand pt-6 text-sm text-charcoal/60">
          <p>Created with Betsy Home Seller Studio.</p>
          <p className="mt-1">Catalogue date: {new Date(catalogue.createdAt).toLocaleDateString()}</p>
        </footer>
      </article>
    </div>
  );
}
