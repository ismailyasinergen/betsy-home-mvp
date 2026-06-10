import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createMoodBoardAction } from "@/app/(marketplace)/account/mood-boards/actions";
import { getCustomerMoodBoards } from "@/lib/mood-boards";

export const dynamic = "force-dynamic";

export default async function MoodBoardsPage() {
  const { customer, boards } = await getCustomerMoodBoards();
  const publicBoards = boards.filter((board) => board.isPublic).length;

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Customer mood boards</p>
            <h1 className="mt-2 text-4xl font-bold">Plan rooms, projects, and gift ideas</h1>
            <p className="mt-2 max-w-3xl text-charcoal/70">
              Signed in as {customer.email}. Mood boards are private by default. Turn on public sharing when you want other customers to discover your board.
            </p>
          </div>
          <Link href="/boards" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View public boards</Link>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form action={createMoodBoardAction} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Create a mood board</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/60">Use boards for living rooms, bedrooms, boutique hotel projects, wedding gifts, or client presentations.</p>

            <label className="mt-5 grid gap-2 text-sm font-semibold">
              Board title
              <input name="title" required placeholder="Boho Living Room Ideas" className="rounded-2xl border border-sand px-4 py-3 outline-none focus:border-clay" />
            </label>

            <label className="mt-4 grid gap-2 text-sm font-semibold">
              Description
              <textarea name="description" placeholder="Warm neutrals, handmade ceramics, soft textures, and natural materials." className="min-h-28 rounded-2xl border border-sand px-4 py-3 outline-none focus:border-clay" />
            </label>

            <label className="mt-4 flex gap-3 rounded-2xl bg-cream p-4 text-sm leading-6 text-charcoal/70">
              <input name="isPublic" type="checkbox" className="mt-1" />
              <span><strong className="text-charcoal">Make this board public.</strong> Other customers can view it in the public mood board gallery. You can turn this off later.</span>
            </label>

            <button className="mt-5 rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Create mood board</button>
          </form>

          <div className="rounded-3xl bg-charcoal p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sand">Why mood boards?</p>
            <h2 className="mt-2 text-3xl font-bold">A home-focused marketplace should help customers plan.</h2>
            <p className="mt-3 text-white/70">Favorites save individual products. Mood boards save a complete design idea, room concept, or business project.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">{boards.length}</p>
                <p className="text-sm text-white/70">your boards</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">{publicBoards}</p>
                <p className="text-sm text-white/70">public boards</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-bold">Your boards</h2>
            <p className="text-sm text-charcoal/60">Private boards stay in your account. Public boards appear at /boards.</p>
          </div>

          {boards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sand bg-white p-8 text-center">
              <p className="text-xl font-bold">No mood boards yet</p>
              <p className="mt-2 text-charcoal/60">Create your first board, then save products to it from product pages.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
                <Link key={board.id} href={`/account/mood-boards/${board.id}`} className="overflow-hidden rounded-3xl border border-sand bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                  <div className="grid h-40 grid-cols-2 gap-1 bg-sand p-1">
                    {board.previewImages.length > 0 ? (
                      board.previewImages.map((imageUrl, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={`${imageUrl}-${index}`} src={imageUrl} alt="Mood board preview" className="h-full w-full rounded-2xl object-cover" />
                      ))
                    ) : (
                      <div className="col-span-2 flex items-center justify-center rounded-2xl bg-cream text-sm font-bold text-clay">No products yet</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold">{board.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${board.isPublic ? "bg-sage/10 text-sage" : "bg-cream text-clay"}`}>{board.isPublic ? "Public" : "Private"}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-charcoal/60">{board.description ?? "No description yet."}</p>
                    <p className="mt-4 text-sm font-bold text-clay">{board.itemCount} product{board.itemCount === 1 ? "" : "s"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
