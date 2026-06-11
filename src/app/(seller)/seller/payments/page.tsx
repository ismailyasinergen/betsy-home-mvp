import type { ReactNode } from "react";
import { clearSellerStripeConnectionAction, connectDemoStripeAccountAction, startStripeOnboardingAction } from "./actions";
import { getSellerPaymentDashboard, isDemoStripeAccount } from "@/lib/stripe-connect";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warning" }) {
  const styles = {
    neutral: "bg-cream text-charcoal/70",
    good: "bg-green-50 text-green-700",
    warning: "bg-yellow-50 text-yellow-800"
  }[tone];

  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${styles}`}>{children}</span>;
}

export default async function SellerPaymentsPage({ searchParams }: { searchParams: Promise<{ demo?: string; connected?: string; refresh?: string; cleared?: string }> }) {
  const params = await searchParams;
  const dashboard = await getSellerPaymentDashboard();
  const shop = dashboard.shop;
  const stripeAccountId = dashboard.stripeAccountId;
  const connectedMode = stripeAccountId ? (isDemoStripeAccount(stripeAccountId) ? "Demo sandbox" : "Stripe Express") : "Not connected";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller Studio</p>
          <h1 className="mt-2 text-4xl font-bold">Payments</h1>
          <p className="mt-2 max-w-3xl text-charcoal/70">Prepare Betsy Home for marketplace payments. Use demo connect while building, then replace it with Stripe Express onboarding when your Stripe test keys are added.</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 text-right shadow-sm">
          <p className="text-sm text-charcoal/60">Connection mode</p>
          <p className="mt-1 text-2xl font-bold">{connectedMode}</p>
        </div>
      </div>

      {params.demo === "connected" ? (
        <div className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-4 text-green-800">
          Demo Stripe account connected. You can now test checkout as a paid demo order without real Stripe keys.
        </div>
      ) : null}

      {params.connected === "1" ? (
        <div className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-4 text-green-800">
          Stripe returned to Betsy Home. In the next step, account.updated webhooks will confirm onboarding status.
        </div>
      ) : null}

      {params.refresh === "1" ? (
        <div className="mt-6 rounded-3xl border border-yellow-100 bg-yellow-50 p-4 text-yellow-800">
          Stripe onboarding was refreshed. Start onboarding again to continue.
        </div>
      ) : null}

      {params.cleared === "1" ? (
        <div className="mt-6 rounded-3xl border border-sand bg-white p-4 text-charcoal/70">
          Payment connection cleared for testing.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Seller payout setup</h2>
              <p className="mt-2 text-charcoal/70">Shop: <strong>{(shop as any)?.shopName ?? "No shop found"}</strong></p>
            </div>
            {dashboard.isConnected ? <StatusBadge tone="good">Connected</StatusBadge> : <StatusBadge tone="warning">Needs setup</StatusBadge>}
          </div>

          <dl className="mt-6 grid gap-3 rounded-3xl bg-cream p-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Stripe configured locally</dt><dd className="font-bold">{dashboard.stripeConfigured ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Stored account ID</dt><dd className="max-w-[220px] truncate font-bold">{stripeAccountId ?? "None"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Mode</dt><dd className="font-bold">{connectedMode}</dd></div>
          </dl>

          <div className="mt-6 grid gap-4 rounded-3xl border border-sand p-5">
            <div>
              <h3 className="font-bold">Option 1: Demo connect</h3>
              <p className="mt-1 text-sm text-charcoal/65">Use this now. It stores a fake connected account ID so you can test the full payment/order UX safely.</p>
            </div>
            <form action={connectDemoStripeAccountAction}>
              <button className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Connect demo Stripe account</button>
            </form>
          </div>

          <div className="mt-4 grid gap-4 rounded-3xl border border-sand p-5">
            <div>
              <h3 className="font-bold">Option 2: Stripe Express onboarding</h3>
              <p className="mt-1 text-sm text-charcoal/65">Use this after adding Stripe test keys to <code>.env</code>. Do not use live keys during development.</p>
            </div>
            <form action={startStripeOnboardingAction}>
              <button className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Start Stripe onboarding</button>
            </form>
            {!dashboard.stripeConfigured ? (
              <p className="text-sm text-yellow-800">STRIPE_SECRET_KEY is not configured, so this button will show an error until test keys are added.</p>
            ) : null}
          </div>

          {dashboard.isConnected ? (
            <form action={clearSellerStripeConnectionAction} className="mt-4">
              <button className="rounded-full border border-red-200 bg-white px-5 py-3 font-bold text-red-700">Clear payment connection</button>
            </form>
          ) : null}
        </section>

        <aside className="grid gap-6 self-start">
          <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Payment summary</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Pending orders</dt><dd className="font-bold">{dashboard.pendingOrders}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Pending value</dt><dd className="font-bold">{money(dashboard.pendingGross)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Paid orders</dt><dd className="font-bold">{dashboard.paidOrders}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Paid gross</dt><dd className="font-bold">{money(dashboard.paidGross)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal/60">Platform fees</dt><dd className="font-bold">{money(dashboard.platformFees)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-sand pt-3 text-base"><dt className="font-bold">Seller net preview</dt><dd className="font-bold">{money(dashboard.sellerNet)}</dd></div>
            </dl>
          </section>

          <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Next payment steps</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-charcoal/70">
              <li>Test demo connect.</li>
              <li>Create a demo paid order from checkout.</li>
              <li>Add Stripe test keys later.</li>
              <li>Run Stripe Express onboarding.</li>
              <li>Use webhooks to mark paid orders automatically.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
