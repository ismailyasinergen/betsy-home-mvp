import Link from "next/link";
import { getAdminReportsData } from "@/lib/admin-data";
import { adminReportExports } from "@/lib/admin-report-exports";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

function shortDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function averageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return "No reviews";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return `${(total / reviews.length).toFixed(1)}★ average`;
}

export default async function AdminReportsPage() {
  const { topShops, topProducts, lowStockProducts, openRequests, latestReviews } = await getAdminReportsData();

  const paidRevenue = topShops.reduce((sum, shop) => sum + Number(shop.paidRevenue ?? 0), 0);
  const lowStockCount = lowStockProducts.length;
  const openRequestCount = openRequests.length;
  const unansweredReviews = latestReviews.filter((review) => !review.sellerResponse).length;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Reports & exports</h1>
      <p className="mt-3 max-w-3xl text-charcoal/70">
        Export marketplace data for operations, seller payouts, products, platform fees, and refund/dispute follow-up.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Top-shop paid revenue</p>
          <p className="mt-2 text-3xl font-bold">${money(paidRevenue)}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Low-stock products</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{lowStockCount}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Open custom requests</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{openRequestCount}</p>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-sm text-charcoal/60">Reviews needing reply</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{unansweredReviews}</p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">CSV downloads</h2>
            <p className="mt-1 text-sm text-charcoal/60">
              Downloads are generated from live Supabase data. Use these for bookkeeping, admin review, and seller payout checks.
            </p>
          </div>
          <p className="rounded-full bg-cream px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-clay">Live exports</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {adminReportExports.map((report) => (
            <a
              key={report.type}
              href={`/admin/reports/export/${report.type}`}
              className="flex min-h-48 flex-col justify-between rounded-3xl border border-sand bg-cream p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span>
                <span className="text-lg font-bold">{report.title}</span>
                <span className="mt-2 block text-sm text-charcoal/60">{report.description}</span>
              </span>
              <span className="mt-5 inline-flex rounded-full bg-clay px-4 py-2 text-sm font-bold text-white">Download CSV</span>
            </a>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Top shops</h2>
          <div className="mt-4 grid gap-3">
            {topShops.map((shop) => (
              <div key={shop.id} className="rounded-2xl bg-cream p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{shop.shopName}</p>
                  <p className="font-bold text-clay">${money(shop.paidRevenue)}</p>
                </div>
                <p className="text-sm text-charcoal/60">{shop._count.products} products · {shop._count.reviews} reviews · {shop.status}</p>
              </div>
            ))}
            {topShops.length === 0 ? <p className="text-charcoal/70">No shops yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Product performance</h2>
          <div className="mt-4 grid gap-3">
            {topProducts.map((product) => (
              <Link href={`/product/${product.slug}`} key={product.id} className="rounded-2xl bg-cream p-4">
                <p className="font-bold">{product.title}</p>
                <p className="text-sm text-charcoal/60">{product.shop.shopName} · {product.category.name}</p>
                <p className="mt-1 text-sm text-charcoal/60">Sold items: {product._count.orderItems} · Favorites: {product._count.favorites} · Reviews: {product._count.reviews}</p>
              </Link>
            ))}
            {topProducts.length === 0 ? <p className="text-charcoal/70">No products yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Low-stock products</h2>
          <div className="mt-4 grid gap-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="rounded-2xl bg-cream p-4">
                <p className="font-bold">{product.title}</p>
                <p className="text-sm text-charcoal/60">{product.shop.shopName} · Stock: {product.quantity}</p>
              </div>
            ))}
            {lowStockProducts.length === 0 ? <p className="text-charcoal/70">No low-stock products.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Open custom requests</h2>
          <div className="mt-4 grid gap-3">
            {openRequests.map((request) => (
              <div key={request.id} className="rounded-2xl bg-cream p-4">
                <p className="font-bold">{request.product?.title ?? "Shop request"}</p>
                <p className="text-sm text-charcoal/60">{request.shop.shopName} · {request.buyer.email}</p>
                <p className="mt-1 line-clamp-2 text-sm text-charcoal/70">{request.message}</p>
              </div>
            ))}
            {openRequests.length === 0 ? <p className="text-charcoal/70">No open custom requests.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-2xl font-bold">Latest reviews</h2>
          <div className="mt-1 text-sm text-charcoal/60">{averageRating(latestReviews)}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {latestReviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{review.rating}★ · {review.product.title}</p>
                  <p className="text-xs text-charcoal/50">{shortDate(review.createdAt)}</p>
                </div>
                <p className="text-sm text-charcoal/60">{review.shop.shopName} · {review.buyer.email}</p>
                <p className="mt-2 line-clamp-3 text-sm text-charcoal/70">{review.comment ?? "No written comment."}</p>
                {!review.sellerResponse ? <p className="mt-2 text-sm font-bold text-red-700">Needs seller response</p> : null}
              </div>
            ))}
            {latestReviews.length === 0 ? <p className="text-charcoal/70">No reviews yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
