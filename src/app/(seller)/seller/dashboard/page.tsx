import type { ReactNode } from "react";
import { CurrencyPrice } from "@/components/currency-price";
import { PaymentStatus, ShippingStatus } from "@prisma/client";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { getSellerUnreadMessageCount } from "@/lib/messages";
import { getSellerInventoryData } from "@/lib/seller-inventory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const inventory = await getSellerInventoryData();
  const shop = inventory.shop;

  let openOrders = 0;
  let pendingRevenue = 0;
  let unreadMessages = 0;

  if (shop) {
    openOrders = await prisma.order.count({
      where: {
        shopId: (shop as any).id,
        shippingStatus: {
          in: [ShippingStatus.NEW, ShippingStatus.PROCESSING]
        },
        paymentStatus: {
          notIn: [PaymentStatus.FAILED, PaymentStatus.REFUNDED]
        }
      }
    });

    const paidOrders = await prisma.order.findMany({
      where: {
        shopId: (shop as any).id,
        paymentStatus: PaymentStatus.PAID
      },
      select: {
        total: true,
        platformFee: true
      }
    });

    pendingRevenue = paidOrders.reduce((total, order) => total + Number(order.total) - Number(order.platformFee), 0);
    unreadMessages = await getSellerUnreadMessageCount();
  }

  const tasks = [
    inventory.metrics.soldOutProducts > 0 ? `${inventory.metrics.soldOutProducts} product(s) are sold out. Restock or hide them.` : null,
    inventory.metrics.lowStockProducts > 0 ? `${inventory.metrics.lowStockProducts} product(s) have low stock.` : null,
    inventory.metrics.missingShippingProducts > 0 ? `${inventory.metrics.missingShippingProducts} product(s) need a shipping profile.` : null,
    inventory.metrics.needsReviewProducts > 0 ? `${inventory.metrics.needsReviewProducts} product(s) need review.` : null,
    openOrders > 0 ? `${openOrders} order(s) need fulfillment.` : null,
    unreadMessages > 0 ? `${unreadMessages} message(s) need a reply.` : null,
    shop && !(shop as any).stripeAccountId ? "Connect Stripe to receive payouts." : null
  ].filter(Boolean) as string[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller Studio</p>
          <h1 className="mt-2 text-4xl font-bold">Dashboard</h1>
          <p className="mt-2 text-charcoal/70">{shop ? `Today’s overview for ${(shop as any).shopName}.` : "No seller shop found."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/seller/inventory" className="rounded-full border border-clay px-5 py-3 font-bold text-clay">Manage inventory</Link>
          <Link href="/seller/listings/new" className="rounded-full bg-clay px-5 py-3 font-bold text-white">Add listing</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Paid order value" value={<CurrencyPrice amount={Number(pendingRevenue)} />} helper="After platform fees in demo mode" />
        <StatCard label="Open orders" value={String(openOrders)} helper="New or processing orders" />
        <StatCard label="Active listings" value={String(inventory.metrics.activeProducts)} helper={`${inventory.metrics.totalUnits} total units`} />
        <StatCard label="Unread messages" value={String(unreadMessages)} helper="Customer replies and inquiries" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Inventory health</h2>
              <p className="mt-1 text-sm text-charcoal/60">Badges and tasks are now based on real seller products.</p>
            </div>
            <Link href="/seller/inventory" className="rounded-full bg-charcoal px-4 py-2 text-sm font-bold text-white">Open inventory</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-cream p-5">
              <p className="text-sm font-semibold text-charcoal/60">Low stock</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{inventory.metrics.lowStockProducts}</p>
            </div>
            <div className="rounded-3xl bg-cream p-5">
              <p className="text-sm font-semibold text-charcoal/60">Sold out</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{inventory.metrics.soldOutProducts}</p>
            </div>
            <div className="rounded-3xl bg-cream p-5">
              <p className="text-sm font-semibold text-charcoal/60">Missing shipping</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{inventory.metrics.missingShippingProducts}</p>
            </div>
            <div className="rounded-3xl bg-cream p-5">
              <p className="text-sm font-semibold text-charcoal/60">Needs review</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{inventory.metrics.needsReviewProducts}</p>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Today’s tasks</h2>
          <div className="mt-4 grid gap-3">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task} className="rounded-2xl bg-cream p-4 text-sm font-medium text-charcoal/75">
                {task}
              </div>
            )) : (
              <div className="rounded-2xl bg-sage/10 p-4 text-sm font-bold text-sage">
                Everything looks healthy. No urgent seller tasks right now.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
