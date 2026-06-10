import { resolve4, resolveMx } from "dns/promises";

export type EmailValidationResult =
  | { ok: true; email: string; domain: string }
  | { ok: false; reason: "invalid-email" | "blocked-email-domain" | "disposable-email" | "role-email" | "email-domain-not-found" | "email-check-failed" };

const BLOCKED_EXACT_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "test.test",
  "localhost",
  "invalid",
  "fake.com",
  "none.com"
]);

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "10minutemail.com",
  "10minute-mail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "trashmail.com",
  "dispostable.com",
  "mintemail.com",
  "maildrop.cc",
  "moakt.com"
]);

const ROLE_LOCAL_PARTS = new Set([
  "admin",
  "administrator",
  "billing",
  "contact",
  "help",
  "info",
  "legal",
  "no-reply",
  "noreply",
  "privacy",
  "sales",
  "security",
  "support"
]);

const COMMON_REAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.com",
  "ymail.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "web.de"
]);

// In local development, DNS/MX lookup can fail because of network/provider issues.
// Real protection is the verification email link, so DNS failures should not block legitimate users by default.
// Set STRICT_EMAIL_DOMAIN_CHECK="true" in production if you want failed MX/A checks to block registration.
const STRICT_EMAIL_DOMAIN_CHECK = process.env.STRICT_EMAIL_DOMAIN_CHECK === "true";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function isBasicEmailFormat(email: string) {
  if (email.length < 6 || email.length > 254) return false;
  if (email.includes("..")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email);
}

function isBlockedDomain(domain: string) {
  if (BLOCKED_EXACT_DOMAINS.has(domain)) return true;
  return [...BLOCKED_EXACT_DOMAINS].some((blocked) => domain.endsWith(`.${blocked}`));
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Email domain DNS check timed out")), milliseconds);
    })
  ]);
}

async function domainCanReceiveMail(domain: string) {
  if (COMMON_REAL_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  const mxRecords = await withTimeout(resolveMx(domain), 2500).catch(() => []);

  if (mxRecords.length > 0) {
    return true;
  }

  // Some small/business domains accept mail through an A record even without MX.
  const addressRecords = await withTimeout(resolve4(domain), 2500).catch(() => []);
  return addressRecords.length > 0;
}

export async function validateRegistrationEmail(rawEmail: string): Promise<EmailValidationResult> {
  const email = normalizeEmail(rawEmail);

  if (!isBasicEmailFormat(email)) {
    return { ok: false, reason: "invalid-email" };
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return { ok: false, reason: "invalid-email" };
  }

  if (ROLE_LOCAL_PARTS.has(localPart)) {
    return { ok: false, reason: "role-email" };
  }

  if (isBlockedDomain(domain)) {
    return { ok: false, reason: "blocked-email-domain" };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: "disposable-email" };
  }

  try {
    const canReceiveMail = await domainCanReceiveMail(domain);

    if (!canReceiveMail && STRICT_EMAIL_DOMAIN_CHECK) {
      return { ok: false, reason: "email-domain-not-found" };
    }
  } catch {
    if (STRICT_EMAIL_DOMAIN_CHECK) {
      return { ok: false, reason: "email-check-failed" };
    }
  }

  return { ok: true, email, domain };
}
