import { getAdminTaxonomyData } from "@/lib/admin-data";
import { createCategory, createRoom, createStyle } from "./actions";

export const dynamic = "force-dynamic";

function CreateBox({ title, action, placeholder }: { title: string; action: (formData: FormData) => Promise<void>; placeholder: string }) {
  return (
    <form action={action} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 flex gap-3">
        <input name="name" placeholder={placeholder} className="min-w-0 flex-1 rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
        <button className="rounded-full bg-clay px-5 py-3 font-bold text-white">Create</button>
      </div>
    </form>
  );
}

export default async function AdminCategoriesPage() {
  const { categories, rooms, styles } = await getAdminTaxonomyData();

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Categories, rooms & styles</h1>
      <p className="mt-3 text-charcoal/70">Control the discovery structure used across Betsy Home.</p>

      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        <CreateBox title="Create category" action={createCategory} placeholder="Example: Handmade Lamps" />
        <CreateBox title="Create room" action={createRoom} placeholder="Example: Dining Room" />
        <CreateBox title="Create style" action={createStyle} placeholder="Example: Japandi" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Categories</h2>
          <div className="mt-4 grid gap-2">
            {categories.map((category) => <div key={category.id} className="flex items-center justify-between rounded-2xl bg-cream p-3"><span className="font-semibold">{category.name}</span><span className="text-sm text-charcoal/60">{category._count.products} products</span></div>)}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Rooms</h2>
          <div className="mt-4 grid gap-2">
            {rooms.map((room) => <div key={room.id} className="flex items-center justify-between rounded-2xl bg-cream p-3"><span className="font-semibold">{room.name}</span><span className="text-sm text-charcoal/60">{room._count.products} products</span></div>)}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Styles</h2>
          <div className="mt-4 grid gap-2">
            {styles.map((style) => <div key={style.id} className="flex items-center justify-between rounded-2xl bg-cream p-3"><span className="font-semibold">{style.name}</span><span className="text-sm text-charcoal/60">{style._count.products} products</span></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
