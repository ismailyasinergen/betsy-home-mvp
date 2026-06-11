import Link from "next/link";
import { createSellerListing } from "@/app/(seller)/seller/listings/actions";
import { getSellerListingFormData } from "@/lib/seller-data";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const { shop, categories, rooms, styles, shippingProfiles } = await getSellerListingFormData();
  const editableCategories = (categories ?? []) as any[];
  const editableRooms = (rooms ?? []) as any[];
  const editableStyles = (styles ?? []) as any[];
  const editableShippingProfiles = (shippingProfiles ?? []) as any[];

  if (!shop) {
    return (
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Listings</p>
        <h1 className="mt-2 text-4xl font-bold">No seller shop found</h1>
        <p className="mt-3 text-charcoal/70">Run npm run seed first so the demo seller shop exists.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Listings</p>
          <h1 className="mt-2 text-4xl font-bold">Add new product</h1>
          <p className="mt-2 text-charcoal/70">Saving to shop: {(shop as any).shopName}</p>
        </div>
        <Link href="/seller/listings" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Back to listings</Link>
      </div>

      <form action={createSellerListing} className="mt-8 grid gap-6 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <section className="grid gap-4">
          <h2 className="text-xl font-bold">Basic info</h2>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Product title *</span>
            <input name="title" required className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Handmade ceramic bowl" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Product description *</span>
            <textarea name="description" required className="min-h-32 rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Describe materials, handmade process, room use, and what makes it special." />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Category *</span>
              <select name="categoryId" required className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue="">
                <option value="" disabled>Select category</option>
                {editableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Room</span>
              <select name="roomId" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue="">
                <option value="">No room selected</option>
                {editableRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Style</span>
              <select name="styleId" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue="">
                <option value="">No style selected</option>
                {editableStyles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-bold">Pricing, inventory, shipping</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Price *</span>
              <input name="price" required type="number" min="0.01" step="0.01" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="38.00" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Stock</span>
              <input name="quantity" type="number" min="0" step="1" defaultValue="1" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">SKU</span>
              <input name="sku" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Optional" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Shipping profile</span>
              <select name="shippingProfileId" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" defaultValue={editableShippingProfiles[0]?.id ?? ""}>
                <option value="">No shipping profile</option>
                {editableShippingProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.profileName}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-bold">Images and product details</h2>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Product image URL</span>
            <input name="imageUrl" type="url" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="https://images.unsplash.com/..." />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Materials</span>
              <input name="materials" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Stoneware clay, Matte glaze" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Best for</span>
              <input name="bestFor" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Living rooms, Coffee tables, Shelves" />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Dimensions</span>
              <input name="dimensions" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="18 cm high x 9 cm wide" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Tags</span>
              <input name="tags" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="handmade, ceramic, home decor" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Care instructions</span>
            <textarea name="careInstructions" className="min-h-24 rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Wipe with a dry cloth. Indoor use recommended." />
          </label>
        </section>

        <section className="grid gap-3">
          <h2 className="text-xl font-bold">Personalization</h2>
          <label className="flex gap-2"><input name="isCustomizable" type="checkbox" /> Allow customers to personalize this item</label>
          <textarea name="personalizationHint" className="min-h-24 rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Add a gift note or request a custom color." />
        </section>

        <div className="flex flex-wrap gap-3">
          <button name="intent" value="draft" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Save draft</button>
          <button name="intent" value="publish" className="rounded-full bg-clay px-5 py-3 font-bold text-white">Publish product</button>
        </div>
      </form>
    </div>
  );
}
