import Link from "next/link";
import { PaymentStatus, RefundRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

function shortDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function statusBadge(label: string, tone: "green" | "red" | "yellow" | "neutral" = "neutral") {
  const classes = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    neutral: "bg-cream text-charcoal/70"
  }[tone];

  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${classes}`}>{label}</span>;
}

function paymentTone(status: PaymentStatus) {
  if (status === PaymentStatus.PAID) return "green" as const;
  if (status === PaymentStatus.REFUNDED || status === PaymentStatus.DISPUTED) return "red" as const;
  if (status === PaymentStatus.PENDING || status === PaymentStatus.PARTIALLY_REFUNDED) return "yellow" as const;
  return "neutral" as const;
}

async function getAdminPaymentsOverview() {
  // Sequential queries are more stable with the Supabase shared pooler in local development.
  const paidTotals = await prisma.order.aggregate({
    where: { paymentStatus: PaymentStatus.PAID },
    _count: { _all: true },
    _sum: { total: true, platformFee: true }
  });

  const pendingTotals = await prisma.order.aggregate({
    where: { paymentStatus: PaymentStatus.PENDING },
    _count: { _all: true },
    _sum: { total: true }
  });

  const refundedTotals = await prisma.order.aggregate({
    where: { paymentStatus: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED] } },
    _count: { _all: true },
    _sum: { total: true, platformFee: true }
  });

  const connectedSellers = await prisma.shop.count({ where: { stripeAccountId: { not: null } } });
  const missingStripeSellers = await prisma.shop.count({ where: { stripeAccountId: null } });

  const manualRefundFollowUps = await prisma.order.count({
    where: {
      refundRequestStatus: RefundRequestStatus.APPROVED,
      paymentStatus: PaymentStatus.REFUNDED,
      refundStripeRefundId: null
    }
  });

  const paymentStatusCounts = await prisma.order.groupBy({
    by: ["paymentStatus"],
    _count: { _all: true },
    _sum: { total: true, platformFee: true }
  });

  const shops = await prisma.shop.findMany({
    include: {
      seller: true,
      orders: {
        where: {
          paymentStatus: {
            in: [PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED]
          }
        },
        select: {
          id: true,
          total: true,
          platformFee: true,
          paymentStatus: true,
          refundRequestStatus: true,
          refundStripeRefundId: true
        }
      },
      _count: { select: { products: true, orders: true } }
    },
    orderBy: { shopName: "asc" }
  });

  const recentOrders = await prisma.order.findMany({
    include: { buyer: true, shop: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 12
  });

  const recentPayouts = await prisma.payout.findMany({
    include: { shop: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  const sellerRows = shops.map((shop) => {
    const paidOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED);
    const pendingOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.PENDING);
    const refundedOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.REFUNDED || order.paymentStatus === PaymentStatus.DISPUTED);
    const paidGross = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const platformFees = paidOrders.reduce((sum, order) => sum + Number(order.platformFee), 0);
    const pendingValue = pendingOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const refundedValue = refundedOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const manualFollowUps = shop.orders.filter(
      (order) => order.refundRequestStatus === RefundRequestStatus.APPROVED && order.paymentStatus === PaymentStatus.REFUNDED && !order.refundStripeRefundId
    ).length;

    return {
      ...shop,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      refundedOrders: refundedOrders.length,
      paidGross,
      platformFees,
      sellerNet: paidGross - platformFees,
      pendingValue,
      refundedValue,
      manualFollowUps
    };
  });

  return {
    paidTotals,
    pendingTotals,
    refundedTotals,
    connectedSellers,
    missingStripeSellers,
    manualRefundFollowUps,
    paymentStatusCounts,
    sellerRows,
    recentOrders,
    recentPayouts
  };
}

export default async function AdminPaymentsPage() {
  const data = await getAdminPaymentsOverview();
  const paidGross = Number(data.paidTotals._sum.total ?? 0);
  const platformFees = Number(data.paidTotals._sum.platformFee ?? 0);
  const sellerNet = paidGross - platformFees;
  const pendingValue = Number(data.pendingTotals._sum.total ?? 0);
  const refundedValue = Number(data.refundedTotals._sum.total ?? 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
          <h1 className="mt-2 text-4xl font-bold">Payments</h1>
          <p className="mt-3 max-w-3xl text-charcoal/70">
            Finance overview for marketplace revenue, platform fees, seller net previews, Stripe Express readiness, and manual refund follow-ups.
          </p>
        </div>
        <a href="/admin/payments/export" className="rounded-full bg-clay px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-clay/90">
          Download payments CSV
        </a>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Paid gross revenue</p>
          <p className="mt-2 text-3xl font-bold">${money(paidGross)}</p>
          <p className="mt-1 text-sm text-charcoal/50">{data.paidTotals._count._all} paid orders</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Platform fees</p>
          <p className="mt-2 text-3xl font-bold text-clay">${money(platformFees)}</p>
          <p className="mt-1 text-sm text-charcoal/50">Commission preview</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Seller net preview</p>
          <p className="mt-2 text-3xl font-bold">${money(sellerNet)}</p>
          <p className="mt-1 text-sm text-charcoal/50">Paid gross minus fees</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Pending value</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">${money(pendingValue)}</p>
          <p className="mt-1 text-sm text-charcoal/50">{data.pendingTotals._count._all} pending orders</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Refunded/disputed</p>
          <p className="mt-2 text-3xl font-bold text-red-700">${money(refundedValue)}</p>
          <p className="mt-1 text-sm text-charcoal/50">{data.refundedTotals._count._all} orders</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Stripe Express connected sellers</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{data.connectedSellers}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Sellers missing Stripe</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{data.missingStripeSellers}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Manual refund follow-ups</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{data.manualRefundFollowUps}</p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Seller payout readiness</h2>
            <p className="mt-1 text-sm text-charcoal/60">Paid value, platform fees, seller net previews, Stripe account state, and refund follow-ups by shop.</p>
          </div>
          <Link href="/admin/reports" className="rounded-full border border-clay px-5 py-2 text-sm font-bold text-clay hover:bg-cream">
            Reports
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-sand">
          <div className="grid grid-cols-7 gap-0 bg-cream px-4 py-3 text-sm font-bold text-charcoal/70">
            <span className="col-span-2">Seller</span>
            <span>Stripe</span>
            <span>Paid gross</span>
            <span>Fees</span>
            <span>Seller net</span>
            <span>Alerts</span>
          </div>
          {data.sellerRows.map((shop) => (
            <div key={shop.id} className="grid grid-cols-7 gap-0 border-t border-sand px-4 py-4 text-sm">
              <div className="col-span-2">
                <p className="font-bold">{shop.shopName}</p>
                <p className="text-charcoal/60">{shop.seller.email}</p>
                <p className="mt-1 text-xs text-charcoal/50">{shop._count.products} products · {shop._count.orders} orders</p>
              </div>
              <div>
                {shop.stripeAccountId ? statusBadge("Connected", "green") : statusBadge("Missing", "red")}
                <p className="mt-1 text-xs text-charcoal/50">{shop.stripeAccountId ?? "No account ID"}</p>
              </div>
              <p className="font-bold">${money(shop.paidGross)}</p>
              <p className="font-bold text-clay">${money(shop.platformFees)}</p>
              <p className="font-bold">${money(shop.sellerNet)}</p>
              <div className="grid gap-1">
                {shop.pendingOrders > 0 ? statusBadge(`${shop.pendingOrders} pending`, "yellow") : null}
                {shop.manualFollowUps > 0 ? statusBadge(`${shop.manualFollowUps} refund follow-up`, "red") : null}
                {shop.pendingOrders === 0 && shop.manualFollowUps === 0 ? statusBadge("Clear", "green") : null}
              </div>
            </div>
          ))}
          {data.sellerRows.length === 0 ? <p className="p-5 text-charcoal/70">No sellers yet.</p> : null}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Payment status ledger</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.paymentStatusCounts.map((row) => (
              <div key={row.paymentStatus} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {statusBadge(row.paymentStatus, paymentTone(row.paymentStatus))}
                  <p className="font-bold">${money(row._sum.total)}</p>
                </div>
                <p className="mt-2 text-sm text-charcoal/60">{row._count._all} orders · Fees ${money(row._sum.platformFee)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Recent payout records</h2>
          <div className="mt-4 grid gap-3">
            {data.recentPayouts.map((payout) => (
              <div key={payout.id} className="rounded-2xl bg-cream p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{payout.shop.shopName}</p>
                  <p className="font-bold">${money(payout.amount)}</p>
                </div>
                <p className="text-sm text-charcoal/60">{payout.status} · {shortDate(payout.createdAt)}</p>
                {payout.stripePayoutId ? <p className="mt-1 text-xs text-charcoal/50">Stripe payout: {payout.stripePayoutId}</p> : null}
              </div>
            ))}
            {data.recentPayouts.length === 0 ? <p className="text-charcoal/70">No payout records yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Recent payment activity</h2>
            <Link href="/admin/orders" className="rounded-full border border-clay px-5 py-2 text-sm font-bold text-clay hover:bg-cream">View orders</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{order.orderNumber}</p>
                  <p className="font-bold">${money(order.total)}</p>
                </div>
                <p className="text-sm text-charcoal/60">{order.shop.shopName} · {order.buyer?.email ?? "guest"} · {shortDate(order.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusBadge(`Payment: ${order.paymentStatus}`, paymentTone(order.paymentStatus))}
                  {statusBadge(`Shipping: ${order.shippingStatus}`)}
                  {order.refundRequestStatus !== RefundRequestStatus.NONE ? statusBadge(`Refund: ${order.refundRequestStatus}`, order.refundRequestStatus === RefundRequestStatus.APPROVED ? "green" : "yellow") : null}
                </div>
                <p className="mt-2 text-sm text-charcoal/70">{order.items.map((item) => `${item.quantity} × ${item.titleSnapshot}`).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
