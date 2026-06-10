import Link from "next/link";
import { getSellerMessageConversations } from "@/lib/messages";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function SellerMessagesPage() {
  const { shop, conversations } = await getSellerMessageConversations();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller Studio</p>
          <h1 className="mt-2 text-4xl font-bold">Messages</h1>
          <p className="mt-2 text-charcoal/65">Reply to buyer questions about products, shipping, orders, and custom requests.</p>
        </div>
        <Link href="/seller/orders" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View orders</Link>
      </div>

      {!shop ? (
        <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <p className="text-charcoal/70">Create a shop first before using seller messages.</p>
        </section>
      ) : conversations.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-sand bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold">No buyer messages yet</h2>
          <p className="mt-2 text-charcoal/60">When customers contact you from product pages or order pages, their messages will appear here.</p>
        </section>
      ) : (
        <section className="mt-8 grid gap-4">
          {conversations.map((conversation) => (
            <Link key={conversation.customerId} href={`/seller/messages/${conversation.customerId}`} className="rounded-3xl border border-sand bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{conversation.customerName}</h2>
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">{conversation.unreadCount} unread</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-charcoal/50">{conversation.customerEmail}</p>
                  <p className="mt-3 text-charcoal/65">{conversation.latestMessage}</p>
                </div>
                <div className="text-right text-sm text-charcoal/55">
                  <p>{formatDate(conversation.latestAt)}</p>
                  <p>{conversation.messageCount} message{conversation.messageCount === 1 ? "" : "s"}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
