import Link from "next/link";
import { UserRole } from "@prisma/client";
import { updateSellerShopSettings } from "@/app/(seller)/seller/settings/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SellerSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; created?: string; already?: string; error?: string }> }) {
  const user = await requireRole([UserRole.SELLER], "/seller/settings");
  const params = await searchParams;

  const shop = await prisma.shop.findFirst({
    where: {
      sellerId: user.id
    }
  });

  if (!shop) {
    return (
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller Studio</p>
        <h1 className="mt-2 text-4xl font-bold">Settings</h1>
        <div className="mt-8 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <p className="text-charcoal/70">You do not have a seller shop yet.</p>
          <Link href="/sell" className="mt-4 inline-block rounded-full bg-clay px-5 py-3 font-bold text-white">Create seller shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Seller Studio</p>
          <h1 className="mt-2 text-4xl font-bold">Shop settings</h1>
          <p className="mt-2 text-charcoal/70">Update your public seller profile and shop branding.</p>
        </div>
        <Link href={`/shop/${shop.shopSlug}`} className="rounded-full border border-clay px-5 py-3 font-bold text-clay">View public shop</Link>
      </div>

      {params.created ? (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-800">Your seller shop was created and submitted for admin review.</p>
      ) : null}
      {params.already ? (
        <p className="mt-6 rounded-2xl border border-sand bg-white p-4 font-semibold text-charcoal/70">Your account already has a seller shop.</p>
      ) : null}
      {params.saved ? (
        <p className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">Shop settings saved.</p>
      ) : null}
      {params.error === "shop-name" ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">Please enter a shop name with at least 3 characters.</p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form action={updateSellerShopSettings} className="grid gap-5 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <label className="grid gap-2 font-semibold">
            Shop name
            <input name="shopName" required minLength={3} defaultValue={shop.shopName} className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          </label>

          <label className="grid gap-2 font-semibold">
            Shop description
            <textarea name="description" rows={5} defaultValue={shop.description ?? ""} className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          </label>

          <label className="grid gap-2 font-semibold">
            Shop announcement
            <textarea name="announcement" rows={3} defaultValue={shop.announcement ?? ""} className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 font-semibold">
              Location
              <input name="location" defaultValue={shop.location ?? ""} placeholder="Istanbul, Türkiye" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
            </label>
            <label className="grid gap-2 font-semibold">
              Country code
              <input name="countryCode" defaultValue={shop.countryCode ?? ""} maxLength={2} placeholder="TR" className="rounded-2xl border border-sand bg-cream px-4 py-3 uppercase outline-none focus:border-clay" />
            </label>
          </div>

          <label className="grid gap-2 font-semibold">
            Logo URL
            <input name="logoUrl" defaultValue={shop.logoUrl ?? ""} placeholder="https://..." className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          </label>

          <label className="grid gap-2 font-semibold">
            Banner URL
            <input name="bannerUrl" defaultValue={shop.bannerUrl ?? ""} placeholder="https://..." className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" />
          </label>

          <button className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Save shop settings</button>
        </form>

        <aside className="grid gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-clay">Shop review status</p>
            <p className="mt-2 text-2xl font-bold">{shop.status.replaceAll("_", " ")}</p>
            <p className="mt-2 text-sm text-charcoal/60">New seller shops stay pending until admin approves them. Sellers can still prepare products, shipping profiles, catalogues, and messages.</p>
          </div>

          <div className="rounded-3xl bg-cream p-5">
            <p className="font-bold">Public URL</p>
            <p className="mt-1 break-all text-sm text-charcoal/60">/shop/{shop.shopSlug}</p>
          </div>

          {shop.logoUrl ? (
            <div>
              <p className="mb-2 font-bold">Logo preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shop.logoUrl} alt={`${shop.shopName} logo`} className="h-24 w-24 rounded-3xl object-cover" />
            </div>
          ) : null}

          {shop.bannerUrl ? (
            <div>
              <p className="mb-2 font-bold">Banner preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shop.bannerUrl} alt={`${shop.shopName} banner`} className="aspect-[16/7] w-full rounded-3xl object-cover" />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
