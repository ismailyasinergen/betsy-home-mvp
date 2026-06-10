import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getOrdersByNumbers } from "@/lib/orders";
import { confirmStripeCheckoutReturnAndMarkPaid } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ orders?: string; stripe?: string }> }) {
  const { orders, stripe } = await searchParams;
  const orderNumbers = String(orders ?? "")
    .split(",")
    .map((orderNumber) => orderNumber.trim())
    .filter(Boolean);

  const isDemoPaid = stripe === "demo-paid";
  const isStripeSuccess = stripe === "success";

  if (isStripeSuccess) {
    await confirmStripeCheckoutReturnAndMarkPaid(orderNumbers);
  }

  const createdOrders = await getOrdersByNumbers(orderNumbers);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Order created</p>
          <h1 className="mt-2 text-4xl font-bold">
            {isDemoPaid || isStripeSuccess ? "Thank you — your order is paid." : "Thank you — your pending order is saved."}
          </h1>
          <p className="mt-3 max-w-3xl text-charcoal/70">
            {isDemoPaid
              ? "This was a safe demo Stripe payment. Betsy Home created real order records in Supabase and marked them as PAID without charging a real card."
              : isStripeSuccess
                ? "Stripe returned a successful checkout. Betsy Home now verifies the Stripe session on return and also accepts webhook confirmations, so the order can be marked PAID even if the local webhook listener is delayed."
                : "This is the pre-Stripe demo order flow. Betsy Home created real order records in Supabase, cleared the cart, and sent the order to the seller dashboard."}
          </p>

          {createdOrders.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {createdOrders.map((order) => (
                <article key={order.id} className="rounded-3xl bg-cream p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-bold">{order.orderNumber}</p>
                      <p className="text-sm text-charcoal/60">Seller: {order.shop.shopName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{money(Number(order.total))}</p>
                      <p className="text-sm text-charcoal/60">Payment: <span className="font-bold text-clay">{order.paymentStatus}</span></p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-charcoal/70">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3">
                        <span>{item.quantity} × {item.titleSnapshot}</span>
                        <span>{money(Number(item.priceSnapshot) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl bg-cream p-5 text-charcoal/70">No order numbers were found in the URL. Create an order from checkout again.</div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/seller/orders" className="rounded-full bg-clay px-6 py-3 font-bold text-white">View seller orders</Link>
            <Link href="/seller/payments" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">View seller payments</Link>
            <Link href="/search" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Continue shopping</Link>
          </div>
        </section>
      </main>
    </>
  );
}
