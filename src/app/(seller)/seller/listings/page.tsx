import { ProductStatus } from "@prisma/client";
import Link from "next/link";
import { changeSellerListingStatus, deleteSellerListing } from "@/app/(seller)/seller/listings/actions";
import { getSellerListings } from "@/lib/seller-data";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SellerListingsPage() {
  const { shop, products } = await getSellerListings();
  const listingItems = (products ?? []) as any[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Products</p>
          <h1 className="mt-2 text-4xl font-bold">Listings</h1>
          <p className="mt-2 text-charcoal/70">{shop ? `Showing products for ${(shop as any).shopName}` : "No seller shop found."}</p>
        </div>
        <Link href="/seller/listings/new" className="rounded-full bg-clay px-5 py-3 font-bold text-white">Add listing</Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-cream text-charcoal/70">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Price</th>
                <th className="p-4">Shipping</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listingItems.map((product) => (
                <tr key={product.id} className="border-t border-sand align-top">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
                        {product.images[0]?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.images[0].imageUrl} alt={product.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold">{product.title}</p>
                        <p className="text-xs text-charcoal/55">/{product.slug}</p>
                        <p className="mt-1 text-xs text-charcoal/50">
                          {product._count.orderItems} orders · {product._count.favorites} favorites · {product._count.reviews} reviews
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{product.category.name}</td>
                  <td className="p-4"><span className="inline-flex rounded-full bg-cream px-3 py-1 text-xs font-bold text-clay">{statusLabel(product.status)}</span></td>
                  <td className="p-4">{product.quantity}</td>
                  <td className="p-4 font-bold">${Number(product.salePrice ?? product.price).toFixed(2)}</td>
                  <td className="p-4">{product.shippingProfile?.profileName ?? <span className="font-semibold text-red-600">No profile</span>}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/product/${product.slug}`} className="rounded-full border border-sand px-3 py-2 font-bold hover:border-clay hover:text-clay">View</Link>
                      <Link href={`/seller/listings/${product.id}/edit`} className="rounded-full bg-charcoal px-3 py-2 font-bold text-white">Edit</Link>

                      {product.status === ProductStatus.ACTIVE ? (
                        <form action={changeSellerListingStatus.bind(null, product.id, ProductStatus.HIDDEN)}>
                          <button className="rounded-full border border-sand px-3 py-2 font-bold hover:border-clay hover:text-clay">Hide</button>
                        </form>
                      ) : (
                        <form action={changeSellerListingStatus.bind(null, product.id, ProductStatus.ACTIVE)}>
                          <button className="rounded-full border border-sand px-3 py-2 font-bold hover:border-clay hover:text-clay">Publish</button>
                        </form>
                      )}

                      <form action={deleteSellerListing.bind(null, product.id)}>
                        <button className="rounded-full border border-red-200 px-3 py-2 font-bold text-red-600 hover:bg-red-50">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {listingItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal/60">No products yet. Add your first listing.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 text-sm text-charcoal/65 shadow-sm">
        Tip: use <strong>Hide</strong> for products you may sell again later. Use <strong>Delete</strong> only for test or duplicate products.
      </div>
    </div>
  );
}
