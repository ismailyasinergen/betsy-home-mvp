import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { submitProductReviewAction } from "@/app/(marketplace)/account/reviews/actions";
import { getCustomerReviewCenterData } from "@/lib/reviews";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function Stars({ value }: { value?: number }) {
  return <span className="text-lg text-clay">{"★".repeat(value ?? 0)}{"☆".repeat(5 - (value ?? 0))}</span>;
}

export default async function CustomerReviewsPage({ searchParams }: { searchParams?: Promise<{ reviewed?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const { customer, reviewableItems, submittedReviews } = await getCustomerReviewCenterData();

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/account" className="text-sm font-bold text-clay">← Back to account</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Customer reviews</p>
            <h1 className="mt-2 text-4xl font-bold">Review your purchases</h1>
            <p className="mt-2 max-w-2xl text-charcoal/70">Signed in as {customer.email}. Paid orders can be reviewed here. Reviews appear on product pages and in Seller Studio.</p>
          </div>
          <Link href="/account/orders" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Order history</Link>
        </div>

        {params.reviewed ? (
          <div className="mt-6 rounded-3xl border border-sage/20 bg-sage/10 p-4 font-semibold text-sage">Review saved successfully.</div>
        ) : null}

        <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Products ready for review</h2>
              <p className="mt-1 text-sm text-charcoal/60">You can create or update one review per purchased product.</p>
            </div>
            <span className="rounded-full bg-cream px-4 py-2 text-sm font-bold text-clay">{reviewableItems.length} reviewable</span>
          </div>

          <div className="mt-6 grid gap-5">
            {reviewableItems.length === 0 ? (
              <div className="rounded-3xl bg-cream p-6 text-charcoal/70">No paid products are ready for review yet. Create a demo paid order first, then return here.</div>
            ) : (
              reviewableItems.map(({ order, item, product, existingReview }) => (
                <article key={`${order.id}-${product.id}`} id={item.id} className="grid gap-5 rounded-3xl bg-cream p-5 lg:grid-cols-[140px_1fr]">
                  <div className="overflow-hidden rounded-3xl bg-white">
                    {product.images[0]?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0].imageUrl} alt={item.titleSnapshot} className="aspect-square w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={`/product/${product.slug}`} className="text-xl font-bold hover:text-clay">{item.titleSnapshot}</Link>
                        <p className="mt-1 text-sm text-charcoal/60">Order {order.orderNumber} · {formatDate(order.createdAt)} · {money(Number(item.priceSnapshot) * item.quantity)}</p>
                      </div>
                      {existingReview ? (
                        <span className="rounded-full bg-sage/10 px-4 py-2 text-sm font-bold text-sage">Reviewed</span>
                      ) : (
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-clay">Needs review</span>
                      )}
                    </div>

                    <form action={submitProductReviewAction} className="mt-5 grid gap-3">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <label className="grid gap-2 text-sm font-bold text-charcoal/70">
                        Rating
                        <select name="rating" defaultValue={existingReview?.rating ?? 5} className="rounded-2xl border border-sand bg-white px-4 py-3 outline-none focus:border-clay">
                          <option value="5">★★★★★ Excellent</option>
                          <option value="4">★★★★☆ Very good</option>
                          <option value="3">★★★☆☆ Good</option>
                          <option value="2">★★☆☆☆ Not great</option>
                          <option value="1">★☆☆☆☆ Poor</option>
                        </select>
                      </label>
                      <textarea
                        name="comment"
                        defaultValue={existingReview?.comment ?? ""}
                        className="min-h-28 rounded-3xl border border-sand bg-white p-4 outline-none focus:border-clay"
                        placeholder="Share details about quality, materials, shipping, packaging, or how it looks in your home..."
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <button className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">{existingReview ? "Update review" : "Submit review"}</button>
                        {existingReview ? <Stars value={existingReview.rating} /> : null}
                      </div>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Your submitted reviews</h2>
          <div className="mt-5 grid gap-4">
            {submittedReviews.length === 0 ? (
              <p className="rounded-3xl bg-cream p-5 text-charcoal/70">You have not submitted any reviews yet.</p>
            ) : (
              submittedReviews.map((review) => (
                <article key={review.id} className="rounded-3xl bg-cream p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/product/${review.product.slug}`} className="font-bold hover:text-clay">{review.product.title}</Link>
                      <p className="mt-1 text-sm text-charcoal/60">{review.shop.shopName} · {formatDate(review.createdAt)}</p>
                    </div>
                    <Stars value={review.rating} />
                  </div>
                  {review.comment ? <p className="mt-3 text-charcoal/75">{review.comment}</p> : null}
                  {review.sellerResponse ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-charcoal/70">
                      <p className="font-bold text-charcoal">Seller response</p>
                      <p className="mt-1">{review.sellerResponse}</p>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
