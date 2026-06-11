import Link from "next/link";
import { replyToReviewAction } from "@/app/(seller)/seller/reviews/actions";
import { getSellerReviewsData } from "@/lib/reviews";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function Stars({ value }: { value: number }) {
  return <span className="text-lg text-clay">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>;
}

export default async function SellerReviewsPage({ searchParams }: { searchParams?: Promise<{ replied?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const { shop, reviews, averageRating, unansweredCount } = await getSellerReviewsData();
  const reviewItems = (reviews ?? []) as any[];

  return (
    <main className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Reviews</p>
          <h1 className="mt-2 text-4xl font-bold">Seller reviews</h1>
          <p className="mt-2 max-w-2xl text-charcoal/70">View customer reviews and reply publicly. Responses appear on product pages.</p>
        </div>
        <Link href="/seller/orders" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Orders</Link>
      </div>

      {!shop ? (
        <div className="mt-8 rounded-3xl border border-sand bg-white p-8 shadow-sm">No seller shop found.</div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <p className="text-sm text-charcoal/60">Shop</p>
              <p className="mt-2 text-2xl font-bold">{(shop as any).shopName}</p>
            </div>
            <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <p className="text-sm text-charcoal/60">Average rating</p>
              <p className="mt-2 text-2xl font-bold">{averageRating ? `${averageRating}/5` : "No reviews"}</p>
            </div>
            <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <p className="text-sm text-charcoal/60">Needs response</p>
              <p className="mt-2 text-2xl font-bold text-clay">{unansweredCount}</p>
            </div>
          </div>

          {params.replied ? (
            <div className="mt-6 rounded-3xl border border-sage/20 bg-sage/10 p-4 font-semibold text-sage">Seller response saved.</div>
          ) : null}

          <section className="mt-8 grid gap-5">
            {reviewItems.length === 0 ? (
              <div className="rounded-3xl border border-sand bg-white p-8 text-charcoal/70 shadow-sm">No reviews yet. Customer reviews will appear here after paid orders.</div>
            ) : (
              reviewItems.map((review) => (
                <article key={review.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                  <div className="grid gap-5 lg:grid-cols-[110px_1fr]">
                    <div className="overflow-hidden rounded-3xl bg-cream">
                      {review.product.images[0]?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.product.images[0].imageUrl} alt={review.product.title} className="aspect-square w-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link href={`/product/${review.product.slug}`} className="text-xl font-bold hover:text-clay">{review.product.title}</Link>
                          <p className="mt-1 text-sm text-charcoal/60">By {review.buyer.name ?? review.buyer.email} · Order {review.order.orderNumber} · {formatDate(review.createdAt)}</p>
                        </div>
                        <Stars value={review.rating} />
                      </div>

                      {review.comment ? <p className="mt-4 text-charcoal/75">{review.comment}</p> : <p className="mt-4 text-charcoal/50">No written comment.</p>}

                      {review.sellerResponse ? (
                        <div className="mt-5 rounded-3xl bg-cream p-4">
                          <p className="font-bold">Your public response</p>
                          <p className="mt-2 text-sm text-charcoal/70">{review.sellerResponse}</p>
                        </div>
                      ) : (
                        <form action={replyToReviewAction} className="mt-5 rounded-3xl bg-cream p-4">
                          <input type="hidden" name="reviewId" value={review.id} />
                          <label className="font-bold" htmlFor={`response-${review.id}`}>Reply publicly</label>
                          <textarea
                            id={`response-${review.id}`}
                            name="sellerResponse"
                            required
                            className="mt-3 min-h-24 w-full rounded-3xl border border-sand bg-white p-4 outline-none focus:border-clay"
                            placeholder="Thank the customer or respond to their feedback..."
                          />
                          <button className="mt-3 rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Post response</button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
