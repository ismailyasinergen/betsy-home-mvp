import Link from "next/link";
import { notFound } from "next/navigation";
import { replyToCustomRequestAction, updateCustomRequestStatusAction } from "@/app/(seller)/seller/custom-requests/[id]/actions";
import { formatCustomOrderDate, getCustomOrderStatusClass, getCustomOrderStatusLabel, getSellerCustomRequestById, money } from "@/lib/custom-orders";

export const dynamic = "force-dynamic";

const statusButtons = [
  { status: "OPEN", label: "Mark open" },
  { status: "QUOTED", label: "Mark quoted" },
  { status: "ACCEPTED", label: "Mark accepted" },
  { status: "DECLINED", label: "Decline" },
  { status: "CLOSED", label: "Close" }
];

export default async function SellerCustomRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customRequestData = (await getSellerCustomRequestById(id)) as any;
  const shop = customRequestData.shop;
  const request = customRequestData.request;

  if (!shop || !request) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/seller/custom-requests" className="text-sm font-bold text-clay">← Back to custom requests</Link>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Custom request</p>
          <h1 className="mt-2 text-4xl font-bold">{request.product?.title ?? "General custom request"}</h1>
          <p className="mt-2 text-charcoal/65">From {request.buyer.name ?? request.buyer.email} · Created {formatCustomOrderDate(request.createdAt)}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-bold ${getCustomOrderStatusClass(request.status)}`}>{getCustomOrderStatusLabel(request.status)}</span>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
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
            <p className="text-sm font-bold text-charcoal/50">Buyer message</p>
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
            <h2 className="text-xl font-bold">Update status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {statusButtons.map((item) => (
                <form key={item.status} action={updateCustomRequestStatusAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="status" value={item.status} />
                  <button className={`rounded-full border px-4 py-2 text-sm font-bold ${request.status === item.status ? "border-clay bg-cream text-clay" : "border-sand bg-white"}`}>{item.label}</button>
                </form>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Reply to buyer</h2>
            <form action={replyToCustomRequestAction} className="mt-4 grid gap-3">
              <input type="hidden" name="requestId" value={request.id} />
              <textarea name="message" required className="min-h-32 rounded-3xl border border-sand bg-cream p-4 outline-none focus:border-clay" placeholder="Send a quote, ask a question, or explain production time..." />
              <label className="flex items-center gap-2 text-sm font-semibold text-charcoal/70">
                <input type="checkbox" name="markAsQuoted" /> Mark this request as quoted
              </label>
              <button className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Send reply</button>
            </form>
            <Link href={`/seller/messages/${request.buyerId}`} className="mt-4 inline-flex text-sm font-bold text-clay">Open full conversation</Link>
          </section>

          <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Product</h2>
            {request.product ? (
              <div className="mt-4 grid gap-4">
                {request.product.images[0]?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={request.product.images[0].imageUrl} alt={request.product.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                ) : null}
                <Link href={`/product/${request.product.slug}`} className="font-bold text-clay">View product page</Link>
              </div>
            ) : (
              <p className="mt-2 text-charcoal/60">This is a general shop request.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
