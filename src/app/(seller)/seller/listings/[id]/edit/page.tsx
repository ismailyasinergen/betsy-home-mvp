import { ProductStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSellerListing, updateSellerListing } from "@/app/(seller)/seller/listings/actions";
import { getSellerListingForEdit } from "@/lib/seller-data";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop, product, categories, rooms, styles, shippingProfiles } = await getSellerListingForEdit(id);

  if (!shop) {
    return (
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Listings</p>
        <h1 className="mt-2 text-4xl font-bold">No seller shop found</h1>
        <p className="mt-3 text-charcoal/70">Create a seller shop before editing products.</p>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const firstImageUrl = product.images[0]?.imageUrl ?? "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Listings</p>
          <h1 className="mt-2 text-4xl font-bold">Edit product</h1>
          <p className="mt-2 text-charcoal/70">Editing {product.title} for {shop.shopName}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/product/${product.slug}`} className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View product</Link>
          <Link href="/seller/listings" className="rounded-full border border-sand px-5 py-3 font-bold">Back to listings</Link>
        </div>
      </div>

      <form action={updateSellerListing.bind(null, product.id)} className="mt-8 grid gap-6 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <section className="grid gap-4">
          <h2 className="text-xl font-bold">Basic info</h2>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Product title *</span>
            <input name="title" required defaultValue={product.title} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Product description *</span>
            <textarea name="description" required defaultValue={product.description} className="min-h-32 rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Category *</span>
              <select name="categoryId" required className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={product.categoryId}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Room</span>
              <select name="roomId" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={product.roomId ?? ""}>
                <option value="">No room selected</option>
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Style</span>
              <select name="styleId" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={product.styleId ?? ""}>
                <option value="">No style selected</option>
                {styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-bold">Pricing, inventory, shipping</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Price *</span>
              <input name="price" required type="number" min="0.01" step="0.01" defaultValue={Number(product.price).toFixed(2)} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Sale price</span>
              <input name="salePrice" type="number" min="0.01" step="0.01" defaultValue={product.salePrice ? Number(product.salePrice).toFixed(2) : ""} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Optional" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Stock</span>
              <input name="quantity" type="number" min="0" step="1" defaultValue={product.quantity} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">SKU</span>
              <input name="sku" defaultValue={product.sku ?? ""} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Optional" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Status</span>
              <select name="status" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={product.status}>
                {Object.values(ProductStatus).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-bold">Shipping profile</span>
            <select name="shippingProfileId" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={product.shippingProfileId ?? ""}>
              <option value="">No shipping profile</option>
              {shippingProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.profileName}</option>)}
            </select>
            {shippingProfiles.length === 0 ? (
              <span className="text-sm text-red-600">Create a shipping profile before publishing products that need shipping validation.</span>
            ) : null}
          </label>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-bold">Images and product details</h2>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Product image URL</span>
            <input name="imageUrl" type="url" defaultValue={firstImageUrl} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="https://images.unsplash.com/..." />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Materials</span>
              <input name="materials" defaultValue={product.materials.join(", ")} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Best for</span>
              <input name="bestFor" defaultValue={product.bestFor.join(", ")} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Dimensions</span>
              <input name="dimensions" defaultValue={product.dimensions ?? ""} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Tags</span>
              <input name="tags" defaultValue={product.tags.join(", ")} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Care instructions</span>
            <textarea name="careInstructions" defaultValue={product.careInstructions ?? ""} className="min-h-24 rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
          </label>
        </section>

        <section className="grid gap-3">
          <h2 className="text-xl font-bold">Personalization</h2>
          <label className="flex gap-2"><input name="isCustomizable" type="checkbox" defaultChecked={product.isCustomizable} /> Allow customers to personalize this item</label>
          <textarea name="personalizationHint" defaultValue={product.personalizationHint ?? ""} className="min-h-24 rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Add a gift note or request a custom color." />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button className="rounded-full bg-clay px-6 py-3 font-bold text-white">Save changes</button>
          <button formAction={deleteSellerListing.bind(null, product.id)} className="rounded-full border border-red-200 px-6 py-3 font-bold text-red-600 hover:bg-red-50">Delete product</button>
        </div>
      </form>
    </div>
  );
}
