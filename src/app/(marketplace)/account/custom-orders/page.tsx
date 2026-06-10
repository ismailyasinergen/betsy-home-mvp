import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { formatCustomOrderDate, getCustomerCustomOrders, getCustomOrderStatusClass, getCustomOrderStatusLabel, money } from "@/lib/custom-orders";

export const dynamic = "force-dynamic";

export default async function CustomerCustomOrdersPage() {
  const { customer, requests } = await getCustomerCustomOrders();

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/account" className="text-sm font-bold text-clay">← Back to account</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Customer account</p>
            <h1 className="mt-2 text-4xl font-bold">Custom order requests</h1>
            <p className="mt-2 text-charcoal/65">Signed in as {customer.email}. Track requests for custom sizes, colors, deadlines, and project quantities.</p>
          </div>
          <Link href="/search" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Find products</Link>
        </div>

        {requests.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-sand bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No custom requests yet</h2>
            <p className="mt-2 text-charcoal/60">Open a product page and use Request custom order to send a request to the seller.</p>
            <Link href="/search" className="mt-5 inline-flex rounded-full bg-clay px-5 py-3 font-bold text-white">Browse products</Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-4">
            {requests.map((request) => (
              <Link key={request.id} href={`/account/custom-orders/${request.id}`} className="grid gap-4 rounded-3xl border border-sand bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft md:grid-cols-[96px_1fr_auto] md:items-center">
                <div className="h-24 w-24 overflow-hidden rounded-2xl bg-cream">
                  {request.product?.images[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={request.product.images[0].imageUrl} alt={request.product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-clay">Custom</div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{request.product?.title ?? "General custom request"}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getCustomOrderStatusClass(request.status)}`}>{getCustomOrderStatusLabel(request.status)}</span>
                  </div>
                  <p className="mt-1 text-sm text-charcoal/55">Seller: {request.shop.shopName} · Created {formatCustomOrderDate(request.createdAt)}</p>
                  <p className="mt-3 line-clamp-2 text-charcoal/65">{request.message}</p>
                </div>
                <div className="text-left text-sm text-charcoal/60 md:text-right">
                  <p>Budget: <span className="font-bold text-charcoal">{request.budget ? money(request.budget) : "Not specified"}</span></p>
                  <p>Quantity: <span className="font-bold text-charcoal">{request.quantity ?? "Not specified"}</span></p>
                  <p>Deadline: <span className="font-bold text-charcoal">{formatCustomOrderDate(request.deadline)}</span></p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
