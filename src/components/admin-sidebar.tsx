import Link from "next/link";
import { adminRoutes } from "@/lib/routes";
import { getAdminNotificationCounts } from "@/lib/admin-data";

function getBadgeCount(label: string, counts: Awaited<ReturnType<typeof getAdminNotificationCounts>>) {
  if (label === "Activity") return (counts as any).activity ?? 0;
  if (label === "Sellers") return (counts as any).sellers ?? 0;
  if (label === "Products") return (counts as any).products ?? 0;
  if (label === "Orders") return (counts as any).orders ?? 0;
  if (label === "Refunds") return (counts as any).refunds ?? 0;
  if (label === "Payments") return (counts as any).payments ?? 0;
  if (label === "Reports") return (counts as any).reports ?? 0;
  return 0;
}

export async function AdminSidebar() {
  const counts = await getAdminNotificationCounts();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-sand bg-charcoal p-6 text-white lg:block">
      <Link href="/admin/dashboard" className="text-2xl font-bold text-white">Betsy Admin</Link>
      <p className="mt-1 text-sm text-white/60">Platform control center</p>
      <nav className="mt-8 grid gap-2">
        {adminRoutes.map((route) => {
          const badge = getBadgeCount(route.label, counts);
          return (
            <Link key={route.href} href={route.href} className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
              <span>{route.label}</span>
              {badge > 0 ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{badge}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
