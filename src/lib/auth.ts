import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, timingSafeEqual, scryptSync } from "crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "betsy_auth_user_id";
export const DEMO_PASSWORD = "demo123";

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

export function getDefaultRedirectForRole(role?: UserRole | null) {
  if (role === UserRole.ADMIN) return "/admin/dashboard";
  if (role === UserRole.SELLER) return "/seller/dashboard";
  return "/account";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;

  const [scheme, salt, key] = storedHash.split("$");

  if (scheme !== "scrypt" || !salt || !key) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(key, "hex");

  if (candidate.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(candidate, stored);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryDatabaseConnectionError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    code === "P1001" ||
    code === "P1008" ||
    code === "P2024" ||
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection")
  );
}

async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTemporaryDatabaseConnectionError(error) || attempt === 3) {
        throw error;
      }

      await wait(600 * attempt);
    }
  }

  throw lastError;
}

export async function getAuthUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function setAuthUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearAuthUserId() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser() {
  const userId = await getAuthUserId();

  if (!userId) {
    return null;
  }

  return withDatabaseRetry(() =>
    prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        createdAt: true
      }
    })
  );
}

export async function requireSignedIn(next = "/account") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!user.emailVerifiedAt && !user.email.endsWith("@betsyhome.test")) {
    redirect(`/check-email?email=${encodeURIComponent(user.email)}&error=verify-required`);
  }

  return user;
}

export async function requireRole(roles: UserRole[], next: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!user.emailVerifiedAt && !user.email.endsWith("@betsyhome.test")) {
    redirect(`/check-email?email=${encodeURIComponent(user.email)}&error=verify-required`);
  }

  if (!roles.includes(user.role)) {
    redirect(getDefaultRedirectForRole(user.role));
  }

  return user;
}
