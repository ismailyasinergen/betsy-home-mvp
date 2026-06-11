import Link from "next/link";
import { notFound } from "next/navigation";
import { getSellerConversation } from "@/lib/messages";
import { sellerReplyMessageAction } from "../actions";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function SellerConversationPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const { shop, customer, messages } = await getSellerConversation(customerId);
  const messageItems = (messages ?? []) as any[];

  if (!shop || !customer) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/seller/messages" className="text-sm font-bold text-clay">← Back to messages</Link>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Buyer conversation</p>
          <h1 className="mt-2 text-4xl font-bold">{(customer as any).name ?? (customer as any).email}</h1>
          <p className="mt-2 text-charcoal/65">{(customer as any).email} · Shop: {(shop as any).shopName}</p>
        </div>
        <Link href="/seller/orders" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Check orders</Link>
      </div>

      <section className="mt-8 rounded-3xl border border-sand bg-white p-5 shadow-sm">
        {messageItems.length === 0 ? (
          <p className="rounded-2xl bg-cream p-4 text-charcoal/65">No messages yet.</p>
        ) : (
          <div className="grid gap-4">
            {messageItems.map((message) => {
              const isSeller = message.senderId === (shop as any).sellerId;
              return (
                <article key={message.id} className={`flex ${isSeller ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-2xl rounded-3xl p-4 ${isSeller ? "bg-clay text-white" : "bg-cream text-charcoal"}`}>
                    <p className="whitespace-pre-wrap leading-7">{message.message}</p>
                    <p className={`mt-2 text-xs ${isSeller ? "text-white/70" : "text-charcoal/50"}`}>{message.sender.name ?? message.sender.email} · {formatDate(message.createdAt)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <form action={sellerReplyMessageAction} className="mt-6 rounded-3xl border border-sand bg-white p-5 shadow-sm">
        <input type="hidden" name="customerId" value={(customer as any).id} />
        <label htmlFor="message" className="font-bold">Reply to customer</label>
        <textarea id="message" name="message" required className="mt-3 min-h-32 w-full rounded-3xl border border-sand bg-cream p-4 outline-none focus:border-clay" placeholder="Write your reply..." />
        <button className="mt-4 rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Send reply</button>
      </form>
    </div>
  );
}
