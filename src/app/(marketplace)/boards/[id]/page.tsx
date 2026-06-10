import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { getPublicMoodBoardById } from "@/lib/mood-boards";

export const dynamic = "force-dynamic";

export default async function PublicMoodBoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getPublicMoodBoardById(id);

  if (!board) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/boards" className="text-sm font-bold text-clay">← Back to public boards</Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold">{board.title}</h1>
              <span className="rounded-full bg-sage/10 px-3 py-1 text-xs font-bold text-sage">Public board</span>
            </div>
            <p className="mt-2 max-w-3xl text-charcoal/70">{board.description ?? "No description yet."}</p>
            <p className="mt-2 text-sm text-charcoal/50">Shared by {board.ownerName} · {board.itemCount} product{board.itemCount === 1 ? "" : "s"}</p>
          </div>
          <Link href="/account/mood-boards" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Create your own board</Link>
        </div>

        <section className="mt-10">
          {board.products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sand bg-white p-8 text-center">
              <p className="text-xl font-bold">This public board has no products yet</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {board.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
