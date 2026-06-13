import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([UserRole.ADMIN], "/admin/dashboard");

  return (
    <div className="flex bg-cream">
      <AdminSidebar />
      <main className="min-h-screen flex-1 p-6 lg:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3 text-sm text-charcoal/60">
          <span>Signed in as <strong>{user.email}</strong></span>
          <form action={signOut}>
            <button className="rounded-full border border-sand bg-white px-4 py-2 font-bold text-charcoal hover:text-clay">Sign out</button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
