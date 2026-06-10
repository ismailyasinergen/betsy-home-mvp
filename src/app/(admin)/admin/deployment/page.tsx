import Link from "next/link";
import { getDeploymentReadinessReport } from "@/lib/deployment-readiness";

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

export default function AdminDeploymentPage() {
  const report = getDeploymentReadinessReport();

  const errors = report.items.filter((item) => item.status === "error").length;
  const warnings = report.items.filter((item) => item.status === "warning").length;
  const ok = report.items.filter((item) => item.status === "ok").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-clay">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-black text-charcoal">
            Deployment readiness
          </h1>
          <p className="mt-2 max-w-3xl text-charcoal/70">
            Pre-launch environment, Stripe, database, and safety checks for Betsy Home.
          </p>
        </div>

        <StatusBadge status={report.overallStatus} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Overall</p>
          <p className="mt-3 text-3xl font-black">{report.overallStatus.toUpperCase()}</p>
        </div>
        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">OK</p>
          <p className="mt-3 text-3xl font-black text-green-700">{ok}</p>
        </div>
        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Warnings</p>
          <p className="mt-3 text-3xl font-black text-yellow-700">{warnings}</p>
        </div>
        <div className="rounded-3xl border border-clay/20 bg-white p-6">
          <p className="text-sm text-charcoal/60">Errors</p>
          <p className="mt-3 text-3xl font-black text-red-700">{errors}</p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-clay/20 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-charcoal">Checks</h2>
          <Link
            href="/admin/health"
            className="rounded-full border border-clay px-5 py-2 text-sm font-black text-clay"
          >
            Open health page
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {report.items.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-clay/10 bg-cream p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-black text-charcoal">{item.name}</p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-sm text-charcoal/70">{item.message}</p>
              {item.detail ? (
                <p className="mt-2 break-all rounded-xl bg-white p-3 text-xs text-charcoal/70">
                  {item.detail}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-clay/20 bg-cream p-6">
        <h2 className="text-xl font-black text-charcoal">Production rule</h2>
        <p className="mt-2 text-charcoal/70">
          Do not publicly launch until this page has no errors, Stripe webhooks are configured,
          and demo seller fallbacks are disabled.
        </p>
      </section>
    </main>
  );
}
