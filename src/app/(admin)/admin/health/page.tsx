import { getAppHealthReport } from "@/lib/app-health";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "ok") return "bg-green-100 text-green-800";
  if (status === "warning") return "bg-yellow-100 text-yellow-900";
  return "bg-red-100 text-red-700";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

export default async function AdminHealthPage() {
  const report = await getAppHealthReport();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-clay">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-black text-charcoal">
            System health
          </h1>
          <p className="mt-2 max-w-3xl text-charcoal/70">
            Check database, environment, and marketplace infrastructure status.
            This page hides secrets and only displays safe configuration details.
          </p>
        </div>

        <StatusBadge status={report.overallStatus} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Overall status</p>
          <p className="mt-3 text-3xl font-black text-charcoal">
            {report.overallStatus.toUpperCase()}
          </p>
        </div>

        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Response time</p>
          <p className="mt-3 text-3xl font-black text-charcoal">
            {report.responseMs}ms
          </p>
        </div>

        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Generated</p>
          <p className="mt-3 text-lg font-black text-charcoal">
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-clay/20 bg-white p-6">
        <h2 className="text-2xl font-black text-charcoal">Database connection</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-cream p-4">
            <p className="text-sm text-charcoal/60">Host</p>
            <p className="mt-1 break-all font-black text-charcoal">
              {report.database.host ?? "Not configured"}
            </p>
          </div>

          <div className="rounded-2xl bg-cream p-4">
            <p className="text-sm text-charcoal/60">User</p>
            <p className="mt-1 break-all font-black text-charcoal">
              {report.database.username ?? "Not configured"}
            </p>
          </div>

          <div className="rounded-2xl bg-cream p-4">
            <p className="text-sm text-charcoal/60">Database</p>
            <p className="mt-1 font-black text-charcoal">
              {report.database.pathname ?? "Not configured"}
            </p>
          </div>

          <div className="rounded-2xl bg-cream p-4">
            <p className="text-sm text-charcoal/60">Parameters</p>
            <p className="mt-1 break-all text-sm font-bold text-charcoal">
              {Object.keys(report.database.params).length
                ? Object.entries(report.database.params)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(" · ")
                : "None"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-clay/20 bg-white p-6">
        <h2 className="text-2xl font-black text-charcoal">Checks</h2>

        <div className="mt-5 space-y-3">
          {report.checks.map((check) => (
            <div
              key={check.name}
              className="rounded-2xl border border-clay/10 bg-cream p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-black text-charcoal">{check.name}</p>
                <StatusBadge status={check.status} />
              </div>
              <p className="mt-2 text-sm text-charcoal/70">{check.message}</p>
              {check.detail ? (
                <p className="mt-2 break-all rounded-xl bg-white p-3 text-xs text-red-700">
                  {check.detail}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-clay/20 bg-cream p-6">
        <h2 className="text-xl font-black text-charcoal">Local dev reminder</h2>
        <p className="mt-2 text-charcoal/70">
          For src-only patches, restart with <code>npm run dev</code>. Avoid{" "}
          <code>npx prisma db pull</code> unless the database schema changed.
        </p>
      </section>
    </main>
  );
}
