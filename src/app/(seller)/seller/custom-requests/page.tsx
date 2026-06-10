import Link from "next/link";
import { formatCustomOrderDate, getCustomOrderStatusClass, getCustomOrderStatusLabel, getSellerCustomRequests, money } from "@/lib/custom-orders";

export const dynamic = "force-dynamic";

export default async function SellerCustomRequestsPage() {
  const { shop, requests, counts } = await getSellerCustomRequests();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller Studio</p>
          <h1 className="mt-2 text-4xl font-bold">Custom requests</h1>
          <p className="mt-2 text-charcoal/65">Manage custom size, color, deadline, project, and bulk order requests.</p>
        </div>
        <Link href="/seller/messages" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Messages</Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm"><p className="text-sm text-charcoal/55">Total</p><p className="mt-1 text-3xl font-bold">{counts.total}</p></div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm"><p className="text-sm text-charcoal/55">Open</p><p className="mt-1 text-3xl font-bold text-blue-700">{counts.open}</p></div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm"><p className="text-sm text-charcoal/55">Quoted</p><p className="mt-1 text-3xl font-bold text-amber-700">{counts.quoted}</p></div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm"><p className="text-sm text-charcoal/55">Accepted</p><p className="mt-1 text-3xl font-bold text-sage">{counts.accepted}</p></div>
      </div>

      {!shop ? (
        <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <p className="text-charcoal/70">Create a shop first before receiving custom requests.</p>
        </section>
      ) : requests.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-sand bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold">No custom requests yet</h2>
          <p className="mt-2 text-charcoal/60">Customers can submit custom requests from product pages. New requests will appear here.</p>
        </section>
      ) : (
        <section className="mt-8 grid gap-4">
          {requests.map((request) => (
            <Link key={request.id} href={`/seller/custom-requests/${request.id}`} className="grid gap-4 rounded-3xl border border-sand bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft lg:grid-cols-[96px_1fr_auto] lg:items-center">
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
                <p className="mt-1 text-sm text-charcoal/55">Buyer: {request.buyer.name ?? request.buyer.email} · Created {formatCustomOrderDate(request.createdAt)}</p>
                <p className="mt-3 line-clamp-2 text-charcoal/65">{request.message}</p>
              </div>
              <div className="text-left text-sm text-charcoal/60 lg:text-right">
                <p>Budget: <span className="font-bold text-charcoal">{request.budget ? money(request.budget) : "Not specified"}</span></p>
                <p>Quantity: <span className="font-bold text-charcoal">{request.quantity ?? "Not specified"}</span></p>
                <p>Deadline: <span className="font-bold text-charcoal">{formatCustomOrderDate(request.deadline)}</span></p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
