import Link from "next/link";
import { sellerRoutes } from "@/lib/routes";
import { getSellerSidebarBadges } from "@/lib/seller-notifications";

function Badge({ value }: { value: number | "!" }) {
  const label = typeof value === "number" && value > 9 ? "9+" : String(value);

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
      {label}
    </span>
  );
}

export async function SellerSidebar() {
  const badges = await getSellerSidebarBadges();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-sand bg-white p-6 lg:block">
      <Link href="/" className="text-2xl font-bold text-clay">Betsy Home</Link>
      <p className="mt-1 text-sm text-charcoal/60">Seller Studio</p>
      <nav className="mt-8 grid gap-2">
        {sellerRoutes.map((route) => {
          const badge = (badges as Record<string, number>)[route.href] ?? 0;

          return (
            <Link key={route.href} href={route.href} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-cream hover:text-clay">
              <span>{route.label}</span>
              {badge ? <Badge value={badge} /> : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-3xl bg-cream p-4 text-xs leading-5 text-charcoal/65">
        <span className="font-bold text-red-600">Red badges</span> show seller actions that need attention, such as new orders, unread messages, open custom requests, low stock, missing shipping profiles, or payment setup.
      </div>
    </aside>
  );
}
