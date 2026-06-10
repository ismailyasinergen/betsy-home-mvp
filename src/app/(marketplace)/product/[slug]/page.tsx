import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { toggleProductFavoriteAction } from "@/app/(marketplace)/account/favorites/actions";
import { sendMessageToSellerAction } from "@/app/(marketplace)/account/messages/actions";
import { createCustomOrderRequestAction } from "@/app/(marketplace)/account/custom-orders/actions";
import { addProductToMoodBoardAction, removeProductFromMoodBoardAction } from "@/app/(marketplace)/account/mood-boards/actions";
import { addProductToCartAction } from "@/app/(marketplace)/cart/actions";
import { isProductFavorited } from "@/lib/favorites";
import { getCustomerMoodBoardOptions } from "@/lib/mood-boards";
import { getFeaturedProducts, getProductBySlug } from "@/lib/marketplace-data";
import { getShippingRestrictionMessage } from "@/lib/shipping";

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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getFeaturedProducts(4);
  const [isFavorited, moodBoards] = await Promise.all([
    isProductFavorited(product.id),
    getCustomerMoodBoardOptions(product.id)
  ]);
  const previewCustomerCountry = "DE";
  const canShip = !product.excludedCountries.some((country) => country.countryCode === previewCustomerCountry);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex items-center justify-center overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.title}
              className="max-h-[720px] w-full rounded-[1.5rem] object-contain"
            />
          </div>

          <section>
            <Link href={`/shop/${product.shopSlug}`} className="text-sm font-bold text-clay">{product.shopName}</Link>
            <h1 className="mt-3 text-5xl font-bold tracking-tight">{product.title}</h1>
            <p className="mt-3 text-charcoal/70">★ {product.rating} · {product.reviewCount} reviews</p>
            <p className="mt-6 text-4xl font-bold">${product.price.toFixed(2)}</p>

            <div className="mt-6 rounded-3xl border border-sand bg-white p-5">
              <p className="font-semibold text-sage">{getShippingRestrictionMessage(canShip)}</p>
              <p className="mt-2 text-sm text-charcoal/60">Preview country: {previewCustomerCountry}. Cart and checkout now validate the buyer’s selected country.</p>
              {product.excludedCountries.length > 0 ? (
                <p className="mt-2 text-sm text-charcoal/60">
                  Seller excluded countries: {product.excludedCountries.map((country) => country.countryName).join(", ")}
                </p>
              ) : null}
            </div>

            <form action={addProductToCartAction} className="mt-6 grid gap-5">
              <input type="hidden" name="productId" value={product.id} />

              {product.customizable ? (
                <div className="grid gap-3">
                  <label className="font-semibold" htmlFor="personalizationText">Personalization note</label>
                  <textarea
                    id="personalizationText"
                    name="personalizationText"
                    className="min-h-28 rounded-3xl border border-sand bg-white p-4 outline-none focus:border-clay"
                    placeholder={product.personalizationHint ?? "Add a gift note or custom request..."}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-clay px-7 py-3 font-bold text-white shadow-soft">Add to cart</button>
                <a href="#custom-order" className="rounded-full border border-clay px-7 py-3 font-bold text-clay">Request custom order</a>
                <a href="#contact-seller" className="rounded-full border border-sand bg-white px-7 py-3 font-bold">Contact seller</a>
                <button
                  formAction={toggleProductFavoriteAction}
                  className={`rounded-full border px-7 py-3 font-bold transition ${isFavorited ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100" : "border-sand bg-white"}`}
                >
                  {isFavorited ? "♥ Remove favorite" : "♡ Favorite"}
                </button>
              </div>
            </form>

            <form id="custom-order" action={createCustomOrderRequestAction} className="mt-6 rounded-3xl border border-clay/25 bg-white p-5 shadow-sm">
              <input type="hidden" name="shopId" value={product.shopId} />
              <input type="hidden" name="productId" value={product.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Request custom order</h2>
                  <p className="mt-1 text-sm text-charcoal/60">Ask {product.shopName} for a custom size, color, quantity, deadline, or project quote.</p>
                </div>
                <Link href="/account/custom-orders" className="text-sm font-bold text-clay">My requests</Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input name="desiredSize" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Desired size, e.g. 30 cm tall" />
                <input name="desiredColor" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Desired color, e.g. matte sage" />
                <input name="quantity" type="number" min="1" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Quantity" />
                <input name="budget" type="number" min="0" step="0.01" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Budget, e.g. 150" />
                <label className="grid gap-1 text-sm font-semibold text-charcoal/65">
                  Deadline
                  <input name="deadline" type="date" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
                </label>
                <input name="shippingCountry" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Shipping country, e.g. Germany" />
              </div>

              <input name="referenceImageUrl" className="mt-3 w-full rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Optional reference image URL" />
              <textarea
                name="message"
                required
                className="mt-3 min-h-28 w-full rounded-3xl border border-sand bg-cream p-4 outline-none focus:border-clay"
                placeholder="Describe what you would like the seller to make or adjust..."
              />
              <button className="mt-4 rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Send custom request</button>
            </form>

            <form id="contact-seller" action={sendMessageToSellerAction} className="mt-6 rounded-3xl border border-sand bg-white p-5 shadow-sm">
              <input type="hidden" name="shopId" value={product.shopId} />
              <input type="hidden" name="productId" value={product.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Contact seller</h2>
                  <p className="mt-1 text-sm text-charcoal/60">Ask {product.shopName} about customization, shipping, sizing, materials, or project quantities.</p>
                </div>
                <Link href={`/shop/${product.shopSlug}`} className="text-sm font-bold text-clay">View shop</Link>
              </div>
              <textarea
                name="message"
                required
                className="mt-4 min-h-28 w-full rounded-3xl border border-sand bg-cream p-4 outline-none focus:border-clay"
                placeholder="Hi, I have a question about this product..."
              />
              <button className="mt-4 rounded-full bg-charcoal px-6 py-3 font-bold text-white">Send message</button>
            </form>

            <div className="mt-6 rounded-3xl border border-sand bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Save to mood board</h2>
                  <p className="mt-1 text-sm text-charcoal/60">Add this product to a room plan, project board, or public inspiration board.</p>
                </div>
                <Link href="/account/mood-boards" className="text-sm font-bold text-clay">Manage boards</Link>
              </div>

              {moodBoards.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-cream p-4 text-sm text-charcoal/70">
                  You do not have any mood boards yet. <Link href="/account/mood-boards" className="font-bold text-clay">Create your first board</Link>.
                </div>
              ) : (
                <form action={addProductToMoodBoardAction} className="mt-4 flex flex-wrap gap-3">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="returnTo" value={`/product/${product.slug}`} />
                  <select name="boardId" className="min-w-64 rounded-full border border-sand bg-white px-4 py-3 font-semibold outline-none focus:border-clay">
                    {moodBoards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.title} {board.hasProduct ? "✓ already saved" : ""}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-full bg-charcoal px-5 py-3 font-bold text-white">Add to board</button>
                </form>
              )}

              {moodBoards.some((board) => board.hasProduct) ? (
                <div className="mt-4 grid gap-2">
                  <p className="text-sm font-bold text-sage">Saved to:</p>
                  <div className="flex flex-wrap gap-2">
                    {moodBoards.filter((board) => board.hasProduct).map((board) => (
                      <form key={board.id} action={removeProductFromMoodBoardAction}>
                        <input type="hidden" name="boardId" value={board.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="returnTo" value={`/product/${product.slug}`} />
                        <button className="rounded-full bg-sage/10 px-4 py-2 text-sm font-bold text-sage hover:bg-red-50 hover:text-red-600">
                          {board.title} · remove
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 rounded-3xl bg-white p-6">
              <h2 className="text-xl font-bold">Product details from database</h2>
              <p className="text-charcoal/70">{product.description}</p>
              <p className="text-charcoal/70"><strong>Category:</strong> {product.category}</p>
              <p className="text-charcoal/70"><strong>Room:</strong> {product.room}</p>
              <p className="text-charcoal/70"><strong>Style:</strong> {product.style}</p>
              {product.materials.length > 0 ? (
                <p className="text-charcoal/70"><strong>Materials:</strong> {product.materials.join(", ")}</p>
              ) : null}
              {product.dimensions ? (
                <p className="text-charcoal/70"><strong>Dimensions:</strong> {product.dimensions}</p>
              ) : null}
              {product.bestFor.length > 0 ? (
                <p className="text-charcoal/70"><strong>Best for:</strong> {product.bestFor.join(", ")}</p>
              ) : null}
              <p className="text-charcoal/70"><strong>Stock:</strong> {product.quantity}</p>
            </div>
          </section>
        </div>

        <section className="mt-16 rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Customer reviews</p>
              <h2 className="mt-2 text-3xl font-bold">What buyers say</h2>
              <p className="mt-2 text-charcoal/60">Reviews are connected to paid orders and saved in Supabase.</p>
            </div>
            <div className="rounded-3xl bg-cream px-5 py-4 text-right">
              <p className="text-3xl font-bold">{product.rating || 0}/5</p>
              <p className="text-sm text-charcoal/60">{product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {product.reviews.length === 0 ? (
              <div className="rounded-3xl bg-cream p-5 text-charcoal/70">No reviews yet. Customers can review this product after a paid order.</div>
            ) : (
              product.reviews.map((review) => (
                <article key={review.id} className="rounded-3xl bg-cream p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{review.buyerName}</p>
                      <p className="mt-1 text-sm text-charcoal/55">{formatDate(review.createdAt)}</p>
                    </div>
                    <Stars value={review.rating} />
                  </div>
                  {review.comment ? <p className="mt-4 text-charcoal/75">{review.comment}</p> : null}
                  {review.sellerResponse ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-charcoal/70">
                      <p className="font-bold text-charcoal">Response from {product.shopName}</p>
                      <p className="mt-1">{review.sellerResponse}</p>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-6 text-3xl font-bold">More handmade finds</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      </main>
    </>
  );
}
