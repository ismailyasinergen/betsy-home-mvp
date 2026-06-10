"use server";

import { redirect } from "next/navigation";
import { ShopStatus, UserRole } from "@prisma/client";
import { DEMO_PASSWORD, clearAuthUserId, getDefaultRedirectForRole, hashPassword, setAuthUserId, verifyPassword } from "@/lib/auth";
import { validateRegistrationEmail } from "@/lib/email-guards";
import { createEmailVerificationToken, createVerificationTokenForEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

function cleanEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function cleanString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const next = cleanString(value);
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}

async function ensureSellerShop(userId: string, name: string) {
  const existingShop = await prisma.shop.findFirst({
    where: {
      sellerId: userId
    }
  });

  if (existingShop) {
    return existingShop;
  }

  const baseSlug = slugify(name || "betsy seller shop") || "betsy-seller-shop";
  let slug = baseSlug;
  let index = 1;

  while (await prisma.shop.findUnique({ where: { shopSlug: slug } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return prisma.shop.create({
    data: {
      sellerId: userId,
      shopName: name || "Betsy Seller Shop",
      shopSlug: slug,
      description: "A Betsy Home seller shop.",
      status: ShopStatus.ACTIVE
    }
  });
}

export async function signInWithPassword(formData: FormData) {
  const email = cleanEmail(formData.get("email"));
  const password = cleanString(formData.get("password"));
  const next = formData.get("next");

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(cleanString(next))}`);
  }

  if (!user.emailVerifiedAt && !user.email.endsWith("@betsyhome.test")) {
    const verification = await createEmailVerificationToken(user.id);
    redirect(`/check-email?email=${encodeURIComponent(user.email)}&error=unverified&devToken=${encodeURIComponent(verification.token)}`);
  }

  await setAuthUserId(user.id);
  redirect(safeNext(next, getDefaultRedirectForRole(user.role)));
}

export async function registerCustomer(formData: FormData) {
  const name = cleanString(formData.get("name"));
  const requestedEmail = cleanEmail(formData.get("email"));
  const password = cleanString(formData.get("password"));

  const emailCheck = await validateRegistrationEmail(requestedEmail);

  if (!emailCheck.ok) {
    redirect(`/register?error=${emailCheck.reason}`);
  }

  if (!password || password.length < 8) {
    redirect("/register?error=short-password");
  }

  const existing = await prisma.user.findUnique({
    where: {
      email: emailCheck.email
    }
  });

  if (existing) {
    redirect("/register?error=exists");
  }

  const user = await prisma.user.create({
    data: {
      name: name || null,
      email: emailCheck.email,
      passwordHash: hashPassword(password),
      role: UserRole.CUSTOMER,
      emailVerifiedAt: null
    }
  });

  const verification = await createEmailVerificationToken(user.id);

  // In production, send verification.verificationPath by email through Resend/Postmark/SendGrid/SES.
  // In local development, we show a clickable development link on /check-email.
  redirect(`/check-email?email=${encodeURIComponent(user.email)}&devToken=${encodeURIComponent(verification.token)}`);
}

export async function resendVerificationEmail(formData: FormData) {
  const email = cleanEmail(formData.get("email"));

  const verification = await createVerificationTokenForEmail(email);

  if (verification) {
    redirect(`/check-email?email=${encodeURIComponent(email)}&sent=1&devToken=${encodeURIComponent(verification.token)}`);
  }

  // Generic response to avoid telling attackers whether an address exists.
  redirect(`/check-email?email=${encodeURIComponent(email)}&sent=1`);
}

export async function signInDemoAccount(formData: FormData) {
  const roleValue = cleanString(formData.get("role"));
  const role = roleValue === "ADMIN" ? UserRole.ADMIN : roleValue === "SELLER" ? UserRole.SELLER : UserRole.CUSTOMER;

  const demo = {
    [UserRole.CUSTOMER]: {
      email: "customer@betsyhome.test",
      name: "Demo Customer"
    },
    [UserRole.SELLER]: {
      email: "seller@betsyhome.test",
      name: "Luna Clay Studio"
    },
    [UserRole.ADMIN]: {
      email: "admin@betsyhome.test",
      name: "Betsy Admin"
    }
  }[role];

  const user = await prisma.user.upsert({
    where: {
      email: demo.email
    },
    update: {
      name: demo.name,
      role,
      passwordHash: hashPassword(DEMO_PASSWORD),
      emailVerifiedAt: new Date()
    },
    create: {
      email: demo.email,
      name: demo.name,
      role,
      passwordHash: hashPassword(DEMO_PASSWORD),
      emailVerifiedAt: new Date()
    }
  });

  if (role === UserRole.SELLER) {
    await ensureSellerShop(user.id, demo.name);
  }

  await setAuthUserId(user.id);
  redirect(getDefaultRedirectForRole(user.role));
}

export async function signOut() {
  await clearAuthUserId();
  redirect("/");
}
