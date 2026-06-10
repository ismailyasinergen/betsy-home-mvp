import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublicMoodBoards } from "@/lib/mood-boards";

export const dynamic = "force-dynamic";

export default async function PublicMoodBoardsPage() {
  const boards = await getPublicMoodBoards();

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Public mood boards</p>
            <h1 className="mt-2 text-4xl font-bold">Inspiration shared by Betsy Home customers</h1>
            <p className="mt-2 max-w-3xl text-charcoal/70">Only opt-in public boards appear here. Private customer boards remain hidden inside customer accounts.</p>
          </div>
          <Link href="/account/mood-boards" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Create your board</Link>
        </div>

        {boards.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-sand bg-white p-10 text-center">
            <p className="text-2xl font-bold">No public mood boards yet</p>
            <p className="mt-2 text-charcoal/60">Create a board and choose the public option to share it with other customers.</p>
            <Link href="/account/mood-boards" className="mt-5 inline-flex rounded-full bg-clay px-5 py-3 font-bold text-white">Create mood board</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link key={board.id} href={`/boards/${board.id}`} className="overflow-hidden rounded-3xl border border-sand bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <div className="grid h-48 grid-cols-2 gap-1 bg-sand p-1">
                  {board.previewImages.length > 0 ? (
                    board.previewImages.map((imageUrl, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`${imageUrl}-${index}`} src={imageUrl} alt="Public mood board preview" className="h-full w-full rounded-2xl object-cover" />
                    ))
                  ) : (
                    <div className="col-span-2 flex items-center justify-center rounded-2xl bg-cream text-sm font-bold text-clay">No products yet</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold">{board.title}</h2>
                    <span className="rounded-full bg-sage/10 px-3 py-1 text-xs font-bold text-sage">Public</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-charcoal/60">{board.description ?? "No description yet."}</p>
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-charcoal/60">
                    <span>by {board.ownerName}</span>
                    <span>{board.itemCount} product{board.itemCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
