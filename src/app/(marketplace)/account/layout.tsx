import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.CUSTOMER], "/account");
  return <>{children}</>;
}
