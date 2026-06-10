import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import {
  deleteMoodBoardAction,
  removeProductFromMoodBoardAction,
  setMoodBoardPublicStatusAction
} from "@/app/(marketplace)/account/mood-boards/actions";
import { getCustomerMoodBoardById } from "@/lib/mood-boards";

export const dynamic = "force-dynamic";

export default async function CustomerMoodBoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCustomerMoodBoardById(id);

  if (!result) {
    notFound();
  }

  const { board } = result;
  const publicUrl = `/boards/${board.id}`;

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/account/mood-boards" className="text-sm font-bold text-clay">← Back to mood boards</Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold">{board.title}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${board.isPublic ? "bg-sage/10 text-sage" : "bg-cream text-clay"}`}>{board.isPublic ? "Public" : "Private"}</span>
            </div>
            <p className="mt-2 max-w-3xl text-charcoal/70">{board.description ?? "No description yet."}</p>
            <p className="mt-2 text-sm text-charcoal/50">{board.itemCount} product{board.itemCount === 1 ? "" : "s"} · Updated {board.updatedAt.toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {board.isPublic ? (
              <Link href={publicUrl} className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View public page</Link>
            ) : null}
            <Link href="/search" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Add more products</Link>
          </div>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form action={setMoodBoardPublicStatusAction} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <input type="hidden" name="boardId" value={board.id} />
            <h2 className="text-2xl font-bold">Sharing settings</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/60">Mood boards are opt-in public. Only boards marked public can be viewed by other customers.</p>
            <label className="mt-4 flex gap-3 rounded-2xl bg-cream p-4 text-sm leading-6 text-charcoal/70">
              <input name="isPublic" type="checkbox" className="mt-1" defaultChecked={board.isPublic} />
              <span><strong className="text-charcoal">Make this board public</strong><br />Other customers can view it in the public gallery and open the share page.</span>
            </label>
            {board.isPublic ? (
              <p className="mt-4 rounded-2xl bg-sage/10 p-4 text-sm font-semibold text-sage">Public link: {publicUrl}</p>
            ) : null}
            <button className="mt-5 rounded-full bg-charcoal px-5 py-3 font-bold text-white">Save sharing settings</button>
          </form>

          <form action={deleteMoodBoardAction} className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
            <input type="hidden" name="boardId" value={board.id} />
            <h2 className="text-2xl font-bold">Delete board</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/60">Deleting a mood board removes the board only. It does not delete the products from Betsy Home.</p>
            <button className="mt-5 rounded-full border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-600">Delete mood board</button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="mb-5 text-3xl font-bold">Products in this board</h2>
          {board.products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sand bg-white p-8 text-center">
              <p className="text-xl font-bold">This board is empty</p>
              <p className="mt-2 text-charcoal/60">Open a product page and use “Save to mood board” to add products here.</p>
              <Link href="/search" className="mt-5 inline-flex rounded-full bg-clay px-5 py-3 font-bold text-white">Browse products</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {board.products.map((product) => (
                <div key={product.id} className="grid gap-3">
                  <ProductCard product={product} />
                  <form action={removeProductFromMoodBoardAction}>
                    <input type="hidden" name="boardId" value={board.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm font-bold text-charcoal/70 hover:text-red-600">Remove from board</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
