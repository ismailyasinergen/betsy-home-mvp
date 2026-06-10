import { ProductStatus } from "@prisma/client";
import Link from "next/link";
import {
  assignInventoryShippingProfile,
  markInventoryNeedsReview,
  markInventorySoldOut,
  publishInventoryProduct,
  updateInventoryQuantity
} from "@/app/(seller)/seller/inventory/actions";
import { getSellerInventoryData } from "@/lib/seller-inventory";

export const dynamic = "force-dynamic";

function formatStatus(status: ProductStatus) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: ProductStatus) {
  switch (status) {
    case ProductStatus.ACTIVE:
      return "bg-sage/10 text-sage";
    case ProductStatus.SOLD_OUT:
      return "bg-red-50 text-red-700";
    case ProductStatus.NEEDS_REVIEW:
      return "bg-yellow-50 text-yellow-800";
    case ProductStatus.HIDDEN:
      return "bg-charcoal/10 text-charcoal/70";
    default:
      return "bg-cream text-clay";
  }
}

function InventoryStat({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
      <p className="text-sm text-charcoal/60">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-charcoal/50">{helper}</p> : null}
    </div>
  );
}

export default async function SellerInventoryPage() {
  const {
    shop,
    products,
    shippingProfiles,
    lowStockProducts,
    soldOutProducts,
    missingShippingProducts,
    needsReviewProducts,
    metrics
  } = await getSellerInventoryData();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Inventory</p>
          <h1 className="mt-2 text-4xl font-bold">Stock management</h1>
          <p className="mt-2 max-w-3xl text-charcoal/70">
            {shop ? `Manage stock, sold-out products, missing shipping profiles, and review items for ${shop.shopName}.` : "No seller shop found."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/seller/shipping" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Shipping profiles</Link>
          <Link href="/seller/listings/new" className="rounded-full bg-clay px-5 py-3 font-bold text-white">Add product</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <InventoryStat label="Total products" value={metrics.totalProducts} helper="All seller listings" />
        <InventoryStat label="Active" value={metrics.activeProducts} helper="Visible to customers" />
        <InventoryStat label="Total units" value={metrics.totalUnits} helper="Available inventory" />
        <InventoryStat label="Low stock" value={metrics.lowStockProducts} helper="3 units or fewer" />
        <InventoryStat label="Sold out" value={metrics.soldOutProducts} helper="Needs restock" />
        <InventoryStat label="Missing shipping" value={metrics.missingShippingProducts} helper="Blocks checkout confidence" />
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">Low stock</p>
          <p className="mt-2 text-3xl font-bold">{lowStockProducts.length}</p>
          <p className="mt-1 text-sm text-charcoal/60">Active products with 1–3 units left.</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">Sold out</p>
          <p className="mt-2 text-3xl font-bold">{soldOutProducts.length}</p>
          <p className="mt-1 text-sm text-charcoal/60">Products with no sellable stock.</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">Needs review</p>
          <p className="mt-2 text-3xl font-bold">{needsReviewProducts.length}</p>
          <p className="mt-1 text-sm text-charcoal/60">Products requiring seller attention.</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">No shipping</p>
          <p className="mt-2 text-3xl font-bold">{missingShippingProducts.length}</p>
          <p className="mt-1 text-sm text-charcoal/60">Products missing a shipping profile.</p>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
        <div className="border-b border-sand p-5">
          <h2 className="text-2xl font-bold">Inventory table</h2>
          <p className="mt-1 text-sm text-charcoal/60">Update quantity, shipping profile, and product status without opening the full edit page.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-cream text-charcoal/70">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Status</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Shipping profile</th>
                <th className="p-4">Signals</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock = product.status === ProductStatus.ACTIVE && product.quantity > 0 && product.quantity <= 3;
                const isSoldOut = product.status === ProductStatus.SOLD_OUT || product.quantity <= 0;
                const isMissingShipping = !product.shippingProfileId;

                return (
                  <tr key={product.id} className="border-t border-sand align-top">
                    <td className="p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
                          {product.images[0]?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0].imageUrl} alt={product.title} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-bold">{product.title}</p>
                          <p className="text-xs text-charcoal/55">{product.category.name} · ${Number(product.salePrice ?? product.price).toFixed(2)}</p>
                          <p className="mt-1 text-xs text-charcoal/50">{product._count.orderItems} orders · {product._count.favorites} favorites</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(product.status)}`}>
                        {formatStatus(product.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <form action={updateInventoryQuantity.bind(null, product.id)} className="flex items-center gap-2">
                        <input
                          name="quantity"
                          type="number"
                          min="0"
                          defaultValue={product.quantity}
                          className="w-24 rounded-2xl border border-sand bg-white px-3 py-2 outline-none focus:border-clay"
                        />
                        <button className="rounded-full bg-charcoal px-3 py-2 text-xs font-bold text-white">Save</button>
                      </form>
                    </td>
                    <td className="p-4">
                      <form action={assignInventoryShippingProfile.bind(null, product.id)} className="grid gap-2">
                        <select
                          name="shippingProfileId"
                          defaultValue={product.shippingProfileId ?? ""}
                          className="min-w-[220px] rounded-2xl border border-sand bg-white px-3 py-2 outline-none focus:border-clay"
                        >
                          <option value="">No shipping profile</option>
                          {shippingProfiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>{profile.profileName}</option>
                          ))}
                        </select>
                        <button className="w-fit rounded-full border border-sand px-3 py-2 text-xs font-bold hover:border-clay hover:text-clay">Update shipping</button>
                      </form>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {isLowStock ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Low stock</span> : null}
                        {isSoldOut ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Sold out</span> : null}
                        {isMissingShipping ? <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-800">No shipping</span> : null}
                        {product.status === ProductStatus.NEEDS_REVIEW ? <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-800">Needs review</span> : null}
                        {!isLowStock && !isSoldOut && !isMissingShipping && product.status !== ProductStatus.NEEDS_REVIEW ? (
                          <span className="rounded-full bg-sage/10 px-3 py-1 text-xs font-bold text-sage">Healthy</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/seller/listings/${product.id}/edit`} className="rounded-full bg-charcoal px-3 py-2 font-bold text-white">Edit</Link>
                        {product.status !== ProductStatus.ACTIVE || product.quantity <= 0 ? (
                          <form action={publishInventoryProduct.bind(null, product.id)}>
                            <button className="rounded-full border border-sand px-3 py-2 font-bold hover:border-clay hover:text-clay">Publish</button>
                          </form>
                        ) : null}
                        <form action={markInventorySoldOut.bind(null, product.id)}>
                          <button className="rounded-full border border-red-200 px-3 py-2 font-bold text-red-600 hover:bg-red-50">Sold out</button>
                        </form>
                        <form action={markInventoryNeedsReview.bind(null, product.id)}>
                          <button className="rounded-full border border-sand px-3 py-2 font-bold hover:border-clay hover:text-clay">Needs review</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-charcoal/60">No products yet. Add your first listing to start tracking inventory.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
