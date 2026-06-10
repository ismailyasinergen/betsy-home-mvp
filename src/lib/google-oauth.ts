import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ShopStatus, UserRole } from "@prisma/client";
import { AUTH_COOKIE_NAME, getDefaultRedirectForRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const GOOGLE_STATE_COOKIE = "betsy_google_oauth_state";
const GOOGLE_NEXT_COOKIE = "betsy_google_oauth_next";
const TEN_MINUTES = 60 * 10;

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getRedirectUri() {
  return `${getAppUrl()}/auth/google/callback`;
}

function safeNextPath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectToLogin(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getRedirectUri()
  };
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
  let shopSlug = baseSlug;
  let index = 1;

  while (await prisma.shop.findUnique({ where: { shopSlug } })) {
    index += 1;
    shopSlug = `${baseSlug}-${index}`;
  }

  return prisma.shop.create({
    data: {
      sellerId: userId,
      shopName: name || "Betsy Seller Shop",
      shopSlug,
      description: "A Betsy Home seller shop.",
      status: ShopStatus.ACTIVE
    }
  });
}

async function exchangeCodeForAccessToken(code: string, config: { clientId: string; clientSecret: string; redirectUri: string }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function getGoogleProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const profile = (await response.json()) as Partial<GoogleProfile>;

  if (!profile.email || !profile.sub) {
    return null;
  }

  return profile as GoogleProfile;
}

export function startGoogleLogin(request: NextRequest) {
  const config = getGoogleConfig();

  if (!config) {
    return redirectToLogin(request, "google-config");
  }

  const state = randomBytes(24).toString("hex");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/account");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TEN_MINUTES
  });
  response.cookies.set(GOOGLE_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TEN_MINUTES
  });

  return response;
}

export async function handleGoogleCallback(request: NextRequest) {
  const config = getGoogleConfig();

  if (!config) {
    return redirectToLogin(request, "google-config");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const savedNext = request.cookies.get(GOOGLE_NEXT_COOKIE)?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return redirectToLogin(request, "google-state");
  }

  const accessToken = await exchangeCodeForAccessToken(code, config);

  if (!accessToken) {
    return redirectToLogin(request, "google-token");
  }

  const profile = await getGoogleProfile(accessToken);

  if (!profile) {
    return redirectToLogin(request, "google-profile");
  }

  const email = profile.email.trim().toLowerCase();

  if (!profile.email_verified) {
    return NextResponse.redirect(new URL(`/check-email?email=${encodeURIComponent(email)}&error=google-unverified`, request.url));
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  });

  const user = existingUser
    ? await prisma.user.update({
        where: {
          id: existingUser.id
        },
        data: {
          name: existingUser.name || profile.name || null,
          avatarUrl: existingUser.avatarUrl || profile.picture || null,
          emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date()
        }
      })
    : await prisma.user.create({
        data: {
          email,
          name: profile.name || null,
          avatarUrl: profile.picture || null,
          role: UserRole.CUSTOMER,
          passwordHash: null,
          emailVerifiedAt: new Date()
        }
      });

  if (user.role === UserRole.SELLER) {
    await ensureSellerShop(user.id, user.name || "Betsy Seller Shop");
  }

  const next = safeNextPath(savedNext, getDefaultRedirectForRole(user.role));
  const redirectTarget = next === "/account" ? getDefaultRedirectForRole(user.role) : next;
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));

  response.cookies.set(AUTH_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  response.cookies.delete(GOOGLE_NEXT_COOKIE);

  return response;
}
