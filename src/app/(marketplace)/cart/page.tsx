import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getCartPageData } from "@/lib/cart";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/app/(marketplace)/cart/actions";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const cart = await getCartPageData(country);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Cart</p>
            <h1 className="mt-2 text-4xl font-bold">Review your cart</h1>
            <p className="mt-2 text-charcoal/70">Items are grouped by seller. The selected shipping country is sent to checkout and validated again before payment.</p>
          </div>
          <form action="/cart" className="rounded-3xl border border-sand bg-white p-4 shadow-sm">
            <label className="grid gap-2 text-sm font-bold">
              Preview shipping country
              <select name="country" defaultValue={cart.selectedCountryCode} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay">
                {cart.countries.map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.code}>{countryOption.name}</option>
                ))}
              </select>
            </label>
            <button className="mt-3 rounded-full bg-charcoal px-4 py-2 text-sm font-bold text-white">Update preview</button>
          </form>
        </div>

        {cart.items.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-sand bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-charcoal/70">Add a product from the marketplace to test the cart and checkout flow.</p>
            <Link href="/search" className="mt-6 inline-flex rounded-full bg-clay px-6 py-3 font-bold text-white">Browse products</Link>
          </section>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="grid gap-5">
              {cart.groups.map((group) => (
                <article key={group.shopSlug} className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link href={`/shop/${group.shopSlug}`} className="text-lg font-bold hover:text-clay">{group.shopName}</Link>
                      <p className="text-sm text-charcoal/60">Seller subtotal: {money(group.subtotal)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {group.items.map((item) => (
                      <div key={item.id} className={`grid gap-4 rounded-3xl border p-4 md:grid-cols-[112px_1fr_auto] ${item.isBlocked ? "border-red-200 bg-red-50" : "border-sand bg-cream/40"}`}>
                        <Link href={`/product/${item.product.slug}`} className="block overflow-hidden rounded-2xl bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.product.imageUrl} alt={item.product.title} className="h-28 w-full object-cover" />
                        </Link>

                        <div>
                          <Link href={`/product/${item.product.slug}`} className="font-bold hover:text-clay">{item.product.title}</Link>
                          <p className="mt-1 text-sm text-charcoal/60">{item.product.categoryName} · {item.product.shippingNote}</p>
                          {item.personalizationText ? (
                            <p className="mt-2 rounded-2xl bg-white p-3 text-sm text-charcoal/70">Personalization: {item.personalizationText}</p>
                          ) : null}
                          <p className={`mt-3 text-sm font-bold ${item.isBlocked ? "text-red-700" : "text-sage"}`}>{item.blockMessage}</p>
                          {item.isBlocked && item.product.excludedCountries.length > 0 ? (
                            <p className="mt-1 text-xs text-red-700">Seller excludes: {item.product.excludedCountries.map((country) => country.countryName).join(", ")}</p>
                          ) : null}
                        </div>

                        <div className="grid gap-3 md:min-w-40 md:justify-items-end">
                          <p className="text-lg font-bold">{money(item.lineTotal)}</p>
                          <div className="flex items-center gap-2">
                            <form action={updateCartItemQuantityAction}>
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="country" value={cart.selectedCountryCode} />
                              <input type="hidden" name="quantity" value={Math.max(1, item.quantity - 1)} />
                              <button className="h-9 w-9 rounded-full border border-sand bg-white font-bold">−</button>
                            </form>
                            <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                            <form action={updateCartItemQuantityAction}>
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="country" value={cart.selectedCountryCode} />
                              <input type="hidden" name="quantity" value={item.quantity + 1} />
                              <button className="h-9 w-9 rounded-full border border-sand bg-white font-bold">+</button>
                            </form>
                          </div>
                          <form action={removeCartItemAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="country" value={cart.selectedCountryCode} />
                            <button className="text-sm font-bold text-charcoal/55 hover:text-clay">Remove</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <p className="text-xl font-bold">Order summary</p>
              <div className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{cart.shippingTotal === 0 ? "Calculated later" : money(cart.shippingTotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{cart.estimatedTax === 0 ? "Calculated later" : money(cart.estimatedTax)}</span></div>
                <div className="flex justify-between border-t border-sand pt-3 text-lg font-bold"><span>Total</span><span>{money(cart.total)}</span></div>
              </div>

              {cart.blockedItems.length > 0 ? (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-bold">Shipping warning</p>
                  <p className="mt-1">{cart.blockedItems.length} item{cart.blockedItems.length === 1 ? "" : "s"} cannot ship to {cart.selectedCountryName}. Choose another country below or continue to checkout to see the blocked items.</p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-cream p-4 text-sm text-sage">
                  <p className="font-bold">Shipping preview passed</p>
                  <p className="mt-1">All cart items can ship to {cart.selectedCountryName}. Checkout will validate this again before payment.</p>
                </div>
              )}

              <form action="/checkout" className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm font-bold">
                  Ship to country for checkout
                  <select name="country" defaultValue={cart.selectedCountryCode} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay">
                    {cart.countries.map((countryOption) => (
                      <option key={countryOption.code} value={countryOption.code}>{countryOption.name}</option>
                    ))}
                  </select>
                </label>
                <button className="rounded-full bg-clay px-5 py-3 text-center font-bold text-white">Continue to checkout</button>
                <p className="text-xs text-charcoal/55">This sends the selected country to checkout. The payment step will run a fresh server-side shipping validation.</p>
              </form>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
