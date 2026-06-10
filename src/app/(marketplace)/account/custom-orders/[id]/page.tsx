import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatCustomOrderDate, getCustomerCustomOrderById, getCustomOrderStatusClass, getCustomOrderStatusLabel, money } from "@/lib/custom-orders";

export const dynamic = "force-dynamic";

export default async function CustomerCustomOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getCustomerCustomOrderById(id);

  if (!request) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/account/custom-orders" className="text-sm font-bold text-clay">← Back to custom requests</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Custom request</p>
            <h1 className="mt-2 text-4xl font-bold">{request.product?.title ?? "General custom request"}</h1>
            <p className="mt-2 text-charcoal/65">Sent to {request.shop.shopName} on {formatCustomOrderDate(request.createdAt)}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-bold ${getCustomOrderStatusClass(request.status)}`}>{getCustomOrderStatusLabel(request.status)}</span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Request details</h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-cream p-4"><dt className="text-sm font-bold text-charcoal/50">Desired size</dt><dd className="mt-1 font-semibold">{request.desiredSize ?? "Not specified"}</dd></div>
              <div className="rounded-2xl bg-cream p-4"><dt className="text-sm font-bold text-charcoal/50">Desired color</dt><dd className="mt-1 font-semibold">{request.desiredColor ?? "Not specified"}</dd></div>
              <div className="rounded-2xl bg-cream p-4"><dt className="text-sm font-bold text-charcoal/50">Quantity</dt><dd className="mt-1 font-semibold">{request.quantity ?? "Not specified"}</dd></div>
              <div className="rounded-2xl bg-cream p-4"><dt className="text-sm font-bold text-charcoal/50">Budget</dt><dd className="mt-1 font-semibold">{request.budget ? money(request.budget) : "Not specified"}</dd></div>
              <div className="rounded-2xl bg-cream p-4"><dt className="text-sm font-bold text-charcoal/50">Deadline</dt><dd className="mt-1 font-semibold">{formatCustomOrderDate(request.deadline)}</dd></div>
              <div className="rounded-2xl bg-cream p-4"><dt className="text-sm font-bold text-charcoal/50">Shipping country</dt><dd className="mt-1 font-semibold">{request.shippingCountry ?? "Not specified"}</dd></div>
            </dl>
            <div className="mt-5 rounded-2xl bg-cream p-4">
              <p className="text-sm font-bold text-charcoal/50">Message</p>
              <p className="mt-2 whitespace-pre-wrap text-charcoal/75">{request.message}</p>
            </div>
            {request.referenceImageUrl ? (
              <div className="mt-5 rounded-2xl bg-cream p-4">
                <p className="text-sm font-bold text-charcoal/50">Reference image URL</p>
                <a href={request.referenceImageUrl} target="_blank" className="mt-2 inline-flex break-all font-bold text-clay" rel="noreferrer">{request.referenceImageUrl}</a>
              </div>
            ) : null}
          </section>

          <aside className="grid gap-6 self-start">
            <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Product</h2>
              {request.product ? (
                <div className="mt-4 grid gap-4">
                  <div className="overflow-hidden rounded-2xl bg-cream">
                    {request.product.images[0]?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={request.product.images[0].imageUrl} alt={request.product.title} className="aspect-[4/3] w-full object-cover" />
                    ) : null}
                  </div>
                  <Link href={`/product/${request.product.slug}`} className="font-bold text-clay">View product page</Link>
                </div>
              ) : (
                <p className="mt-2 text-charcoal/60">This request was sent directly to the shop.</p>
              )}
            </section>

            <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Seller contact</h2>
              <p className="mt-2 text-sm text-charcoal/60">Continue the conversation with {request.shop.shopName} through messages.</p>
              <Link href={`/account/messages/${request.shop.id}`} className="mt-4 inline-flex rounded-full bg-clay px-5 py-3 font-bold text-white">Open messages</Link>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
