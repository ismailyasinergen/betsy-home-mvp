export const dynamic = "force-dynamic";

const events = [
  {
    name: "Order created",
    path: "/api/notifications/events/order-created",
    sends: "Customer order confirmation + seller new order alert",
  },
  {
    name: "Shipping updated",
    path: "/api/notifications/events/shipping-updated",
    sends: "Customer shipping update",
  },
  {
    name: "Refund requested",
    path: "/api/notifications/events/refund-requested",
    sends: "Seller refund request alert + admin copy",
  },
  {
    name: "Refund resolved",
    path: "/api/notifications/events/refund-resolved",
    sends: "Customer refund approved/rejected email",
  },
  {
    name: "Manual refund follow-up",
    path: "/api/notifications/events/manual-refund-followup",
    sends: "Admin manual refund follow-up alert",
  },
];

export default function AdminNotificationEventsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-clay">
          Admin
        </p>
        <h1 className="mt-4 text-4xl font-black text-charcoal">
          Notification event wiring
        </h1>
        <p className="mt-2 max-w-3xl text-charcoal/70">
          These endpoints connect real order, shipping, refund, and manual follow-up
          events to the local-safe notification system.
        </p>
      </div>

      <section className="mt-8 rounded-3xl border border-clay/20 bg-white p-6">
        <h2 className="text-2xl font-black text-charcoal">Event endpoints</h2>

        <div className="mt-5 space-y-3">
          {events.map((event) => (
            <div
              key={event.path}
              className="rounded-2xl border border-clay/10 bg-cream p-4"
            >
              <p className="font-black text-charcoal">{event.name}</p>
              <p className="mt-1 text-sm text-charcoal/70">{event.sends}</p>
              <code className="mt-3 block break-all rounded-xl bg-white p-3 text-xs text-charcoal/70">
                POST {event.path} {"{ orderId: \"...your-order-id...\" }"}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-clay/20 bg-cream p-6">
        <h2 className="text-xl font-black text-charcoal">Integration note</h2>
        <p className="mt-2 text-charcoal/70">
          Existing checkout, seller shipping, and refund server actions can call the
          helpers in <code>src/lib/notification-events.ts</code>. Notifications remain
          log-only until a real provider is enabled.
        </p>
      </section>
    </main>
  );
}
