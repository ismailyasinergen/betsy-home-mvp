import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CHECKOUT_COUNTRIES, getCartPageData } from "@/lib/cart";
import { createDemoPaidOrderAction, createPendingOrderAction, createStripeCheckoutSessionAction, validateCheckoutAndContinueAction } from "@/app/(marketplace)/checkout/actions";
import { getCheckoutPaymentReadiness } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ country?: string; ready?: string; blocked?: string; payment?: string }> }) {
  const { country, ready, blocked, payment } = await searchParams;
  const cart = await getCartPageData(country);
  const paymentReadiness = await getCheckoutPaymentReadiness(cart.groups.map((group) => group.shopId));
  const isReadyForPayment = ready === "1" && cart.canCheckout;
  const hasBlockedNotice = blocked === "1" || cart.blockedItems.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Checkout</p>
            <h1 className="mt-2 text-4xl font-bold">Shipping and payment</h1>
            <p className="mt-2 text-charcoal/70">Checkout validates seller shipping restrictions first, then prepares a safe Stripe Connect payment flow.</p>
          </div>
          <Link href={`/cart?country=${cart.selectedCountryCode}`} className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Back to cart</Link>
        </div>

        {payment === "connect-demo-first" ? (
          <div className="mt-6 rounded-3xl border border-yellow-100 bg-yellow-50 p-4 text-yellow-800">
            Connect the seller demo Stripe account first from Seller Studio → Payments.
          </div>
        ) : null}

        {payment === "not-ready" ? (
          <div className="mt-6 rounded-3xl border border-yellow-100 bg-yellow-50 p-4 text-yellow-800">
            Stripe checkout is not ready yet. Check seller payment connection and local Stripe test keys.
          </div>
        ) : null}

        {payment === "cancelled" ? (
          <div className="mt-6 rounded-3xl border border-sand bg-white p-4 text-charcoal/70">
            Stripe checkout was cancelled. You can validate shipping and try again.
          </div>
        ) : null}

        {cart.items.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-sand bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No items to checkout</h2>
            <p className="mt-2 text-charcoal/70">Add a product first, then return to checkout.</p>
            <Link href="/search" className="mt-6 inline-flex rounded-full bg-clay px-6 py-3 font-bold text-white">Browse products</Link>
          </section>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <form action={validateCheckoutAndContinueAction} className="grid gap-6 rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <section>
                <h2 className="text-xl font-bold">Shipping address</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input name="fullName" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Full name" defaultValue="Demo Customer" />
                  <select name="country" defaultValue={cart.selectedCountryCode} className="rounded-2xl border border-sand p-3 outline-none focus:border-clay">
                    {CHECKOUT_COUNTRIES.map((countryOption) => (
                      <option key={countryOption.code} value={countryOption.code}>{countryOption.name}</option>
                    ))}
                  </select>
                  <input name="line1" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay md:col-span-2" placeholder="Address line 1" defaultValue="Demo address 12" />
                  <input name="city" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="City" defaultValue="Berlin" />
                  <input name="postalCode" className="rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Postal code" defaultValue="10115" />
                </div>
                <p className="mt-3 text-sm text-charcoal/60">Selected checkout country: <strong>{cart.selectedCountryName}</strong>. If you change the country above, validate again before creating the order.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold">Shipping restriction validation</h2>
                {hasBlockedNotice ? (
                  <div className="mt-4 rounded-2xl bg-red-50 p-4 text-red-700">
                    <p className="font-bold">Payment is blocked for {cart.selectedCountryName}</p>
                    <p className="mt-1 text-sm">One or more sellers do not ship selected items to this country. Choose another country above, or return to cart and remove blocked items.</p>
                    {cart.blockedItems.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                        {cart.blockedItems.map((item) => (
                          <li key={item.id}>{item.product.title}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-cream p-4 text-sage">
                    <p className="font-bold">Shipping preview passed</p>
                    <p className="mt-1 text-sm">All cart items can ship to {cart.selectedCountryName}. Payment actions still validate this again on the server.</p>
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-xl font-bold">Payment readiness</h2>
                <div className="mt-3 rounded-2xl bg-cream p-4 text-charcoal/70">
                  <p className="font-bold text-charcoal">{paymentReadiness.message}</p>
                  <ul className="mt-3 grid gap-1 text-sm">
                    <li>Stripe keys configured locally: <strong>{paymentReadiness.stripeConfigured ? "Yes" : "No"}</strong></li>
                    <li>Seller payment account: <strong>{paymentReadiness.allSellersConnected ? "Connected" : "Missing"}</strong></li>
                    <li>Multi-seller checkout: <strong>{paymentReadiness.isMultiSellerCart ? "Not supported yet" : "Single seller"}</strong></li>
                  </ul>
                  {!paymentReadiness.allSellersConnected ? (
                    <Link href="/seller/payments" className="mt-3 inline-flex text-sm font-bold text-clay">Connect seller payments →</Link>
                  ) : null}
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <button className="rounded-full border border-clay px-6 py-3 font-bold text-clay">
                  {cart.blockedItems.length > 0 ? "Re-check selected country" : "Validate shipping"}
                </button>

                {isReadyForPayment ? (
                  <button formAction={createPendingOrderAction} className="rounded-full border border-sand bg-white px-6 py-3 font-bold text-charcoal">
                    Create pending order
                  </button>
                ) : null}

                {isReadyForPayment && paymentReadiness.canUseDemoStripe ? (
                  <button formAction={createDemoPaidOrderAction} className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">
                    Demo Stripe paid order
                  </button>
                ) : null}

                {isReadyForPayment && paymentReadiness.canUseRealStripe ? (
                  <button formAction={createStripeCheckoutSessionAction} className="rounded-full bg-charcoal px-6 py-3 font-bold text-white shadow-soft">
                    Pay with Stripe Connect
                  </button>
                ) : null}
              </div>
            </form>

            <aside className="h-fit rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <p className="text-xl font-bold">Review order</p>
              <div className="mt-5 grid gap-4">
                {cart.groups.map((group) => (
                  <div key={group.shopId} className="rounded-2xl bg-cream p-4">
                    <p className="font-bold">{group.shopName}</p>
                    <div className="mt-3 grid gap-2 text-sm text-charcoal/70">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex justify-between gap-3">
                          <span>{item.quantity} × {item.product.title}</span>
                          <span className="font-bold text-charcoal">{money(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 border-t border-sand pt-5 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>Calculated in Stripe/shipping step</span></div>
                <div className="flex justify-between border-t border-sand pt-3 text-lg font-bold"><span>Total preview</span><span>{money(cart.total)}</span></div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
