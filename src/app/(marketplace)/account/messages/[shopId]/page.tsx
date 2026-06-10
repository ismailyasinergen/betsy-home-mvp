import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCustomerConversation } from "@/lib/messages";
import { customerReplyMessageAction } from "../actions";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function CustomerConversationPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const { customer, shop, messages } = await getCustomerConversation(shopId);

  if (!shop) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/account/messages" className="text-sm font-bold text-clay">← Back to messages</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-clay">Conversation</p>
            <h1 className="mt-2 text-4xl font-bold">{shop.shopName}</h1>
            <p className="mt-2 text-charcoal/65">You are messaging as {customer.email}.</p>
          </div>
          <Link href={`/shop/${shop.shopSlug}`} className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View shop</Link>
        </div>

        <section className="mt-8 rounded-3xl border border-sand bg-white p-5 shadow-sm">
          {messages.length === 0 ? (
            <p className="rounded-2xl bg-cream p-4 text-charcoal/65">No messages yet. Send the first message below.</p>
          ) : (
            <div className="grid gap-4">
              {messages.map((message) => {
                const isCustomer = message.senderId === customer.id;
                return (
                  <article key={message.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-2xl rounded-3xl p-4 ${isCustomer ? "bg-clay text-white" : "bg-cream text-charcoal"}`}>
                      <p className="whitespace-pre-wrap leading-7">{message.message}</p>
                      <p className={`mt-2 text-xs ${isCustomer ? "text-white/70" : "text-charcoal/50"}`}>{message.sender.name ?? message.sender.email} · {formatDate(message.createdAt)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <form action={customerReplyMessageAction} className="mt-6 rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <input type="hidden" name="shopId" value={shop.id} />
          <label htmlFor="message" className="font-bold">Reply to seller</label>
          <textarea id="message" name="message" required className="mt-3 min-h-32 w-full rounded-3xl border border-sand bg-cream p-4 outline-none focus:border-clay" placeholder="Write your message..." />
          <button className="mt-4 rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Send message</button>
        </form>
      </main>
    </>
  );
}
