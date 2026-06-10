import { getNotificationTemplatePreviews } from "@/lib/notification-templates";

export const dynamic = "force-dynamic";

export default function AdminNotificationsPage() {
  const previews = getNotificationTemplatePreviews();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-clay">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-black text-charcoal">
            Email notifications
          </h1>
          <p className="mt-2 max-w-3xl text-charcoal/70">
            Local-safe notification templates for order, shipping, refund, review,
            and admin follow-up workflows. During MVP testing, notifications are
            logged instead of sent.
          </p>
        </div>

        <a
          href="/api/notifications/test"
          className="rounded-full bg-clay px-6 py-3 text-sm font-black text-white"
        >
          Send test notification
        </a>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Mode</p>
          <p className="mt-3 text-3xl font-black text-charcoal">
            {process.env.EMAIL_LOG_ONLY === "false" ? "Provider" : "Log only"}
          </p>
        </div>

        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Templates</p>
          <p className="mt-3 text-3xl font-black text-charcoal">{previews.length}</p>
        </div>

        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Local log</p>
          <p className="mt-3 text-lg font-black text-charcoal">
            .local-notifications
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {previews.map((preview) => (
          <article
            key={preview.kind}
            className="rounded-3xl border border-clay/20 bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-clay">
                  {preview.kind.replaceAll("_", " ")}
                </p>
                <h2 className="mt-2 text-2xl font-black text-charcoal">
                  {preview.subject}
                </h2>
              </div>
              <span className="rounded-full bg-cream px-4 py-2 text-xs font-black text-charcoal/70">
                Template
              </span>
            </div>

            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream p-4 text-sm text-charcoal/80">
              {preview.text}
            </pre>
          </article>
        ))}
      </section>
    </main>
  );
}
