import { UserRole } from "@prisma/client";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentCustomerOrNull() {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== UserRole.CUSTOMER) {
    return null;
  }

  return prisma.user.findUniqueOrThrow({
    where: {
      id: currentUser.id
    }
  });
}

export async function requireCurrentCustomer(next = "/account") {
  const currentUser = await requireRole([UserRole.CUSTOMER], next);

  return prisma.user.findUniqueOrThrow({
    where: {
      id: currentUser.id
    }
  });
}

// Kept for compatibility with the existing codebase.
// After Google login/auth was added, this no longer creates or falls back to the demo customer.
// It now always returns the signed-in verified customer, or redirects to login/check-email.
export async function getDemoCustomer() {
  return requireCurrentCustomer("/account");
}
