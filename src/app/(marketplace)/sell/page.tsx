import Link from "next/link";
import { UserRole } from "@prisma/client";
import { createSellerShop } from "@/app/(marketplace)/sell/actions";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SellPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  const { error } = await searchParams;

  const shop = user
    ? await prisma.shop.findFirst({
        where: {
          sellerId: user.id
        }
      })
    : null;

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14">
        <section className="grid gap-8 rounded-[2rem] bg-white p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Sell on Betsy Home</p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight">Open your handmade home shop.</h1>
            <p className="mt-5 text-lg text-charcoal/70">
              Create listings, manage shipping restrictions, receive orders, connect Stripe, and generate professional PDF catalogues for buyers and business clients.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                "Seller Studio dashboard",
                "Shipping excluded countries",
                "PDF product catalogues",
                "Custom order requests",
                "Demo Stripe Connect flow"
  ].map((feature) => (
                <div key={feature} className="rounded-3xl border border-sand bg-cream p-5 font-semibold">{feature}</div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-sand bg-cream p-6">
            {user?.role === UserRole.ADMIN ? (
              <div>
                <h2 className="text-2xl font-bold">You are signed in as admin.</h2>
                <p className="mt-3 text-charcoal/70">Admins manage sellers from the platform dashboard.</p>
                <Link href="/admin/sellers" className="mt-6 inline-block rounded-full bg-clay px-6 py-3 font-bold text-white">Go to seller approvals</Link>
              </div>
            ) : shop ? (
              <div>
                <h2 className="text-2xl font-bold">Your shop is already created.</h2>
                <p className="mt-3 text-charcoal/70">Shop status: <strong>{shop.status.replaceAll("_", " ")}</strong></p>
                <p className="mt-2 text-charcoal/70">Shop name: <strong>{shop.shopName}</strong></p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/seller/dashboard" className="rounded-full bg-clay px-6 py-3 font-bold text-white">Open Seller Studio</Link>
                  <Link href="/seller/settings" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Edit shop profile</Link>
                </div>
              </div>
            ) : user ? (
              <form action={createSellerShop} className="grid gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Create your seller shop</h2>
                  <p className="mt-2 text-charcoal/70">Your shop will be submitted for admin review before it appears as an approved seller.</p>
                </div>

                {error === "shop-name" ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">Please enter a shop name with at least 3 characters.</p>
                ) : null}

                <label className="grid gap-2 font-semibold">
                  Shop name
                  <input name="shopName" required minLength={3} placeholder="Luna Clay Studio" className="rounded-2xl border border-sand bg-white px-4 py-3 outline-none focus:border-clay" />
                </label>

                <label className="grid gap-2 font-semibold">
                  Short description
                  <textarea name="description" rows={4} placeholder="Handmade ceramics and home pieces for calm interiors." className="rounded-2xl border border-sand bg-white px-4 py-3 outline-none focus:border-clay" />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 font-semibold">
                    Location
                    <input name="location" placeholder="Istanbul, Türkiye" className="rounded-2xl border border-sand bg-white px-4 py-3 outline-none focus:border-clay" />
                  </label>
                  <label className="grid gap-2 font-semibold">
                    Country code
                    <input name="countryCode" placeholder="TR" maxLength={2} className="rounded-2xl border border-sand bg-white px-4 py-3 uppercase outline-none focus:border-clay" />
                  </label>
                </div>

                <label className="grid gap-2 font-semibold">
                  Logo URL
                  <input name="logoUrl" placeholder="https://..." className="rounded-2xl border border-sand bg-white px-4 py-3 outline-none focus:border-clay" />
                </label>

                <label className="grid gap-2 font-semibold">
                  Banner URL
                  <input name="bannerUrl" placeholder="https://..." className="rounded-2xl border border-sand bg-white px-4 py-3 outline-none focus:border-clay" />
                </label>

                <button className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Create seller shop</button>
              </form>
            ) : (
              <div>
                <h2 className="text-2xl font-bold">Sign in before opening a shop.</h2>
                <p className="mt-3 text-charcoal/70">Create a customer account first, then Betsy Home can upgrade your account into a seller account.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/login?next=/sell" className="rounded-full bg-clay px-6 py-3 font-bold text-white">Sign in</Link>
                  <Link href="/register" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Register</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
