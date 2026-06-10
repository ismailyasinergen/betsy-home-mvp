import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getCustomerMessageConversations } from "@/lib/messages";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function CustomerMessagesPage() {
  const { customer, conversations } = await getCustomerMessageConversations();

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/account" className="text-sm font-bold text-clay">← Back to account</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Customer messages</p>
            <h1 className="mt-2 text-4xl font-bold">Your seller conversations</h1>
            <p className="mt-2 max-w-2xl text-charcoal/70">Signed in as {customer.email}. Ask sellers about handmade products, shipping, personalization, or custom requests.</p>
          </div>
          <Link href="/search" className="rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Find products</Link>
        </div>

        {conversations.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-sand bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No messages yet</h2>
            <p className="mt-2 text-charcoal/60">Open a product page and use Contact seller to start a conversation.</p>
            <Link href="/search" className="mt-5 inline-flex rounded-full border border-clay px-5 py-3 font-bold text-clay">Browse products</Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-4">
            {conversations.map((conversation) => (
              <Link key={conversation.shopId} href={`/account/messages/${conversation.shopId}`} className="rounded-3xl border border-sand bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">{conversation.shopName}</h2>
                      {conversation.unreadCount > 0 ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">{conversation.unreadCount} unread</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-charcoal/65">{conversation.latestMessage}</p>
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
      </main>
    </>
  );
}
