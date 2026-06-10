import Link from "next/link";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { getSellerShippingProfiles } from "@/lib/seller-data";
import { createShippingProfile, deleteShippingProfile } from "@/app/(seller)/seller/shipping/actions";

export const dynamic = "force-dynamic";

const suggestedExcludedCodes = new Set(["RU", "BY", "IR", "SY", "KP"]);

function money(value: unknown) {
  if (value === null || value === undefined) {
    return "Not set";
  }

  return `$${Number(value).toFixed(2)}`;
}

export default async function SellerShippingPage() {
  const { shop, shippingProfiles } = await getSellerShippingProfiles();

  if (!shop) {
    return (
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Shipping</p>
        <h1 className="mt-2 text-4xl font-bold">No seller shop found</h1>
        <p className="mt-3 text-charcoal/70">Create a seller shop first, then come back to create shipping profiles.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Shipping</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight md:text-5xl">Shipping profiles</h1>
          <p className="mt-3 max-w-3xl text-charcoal/70">
            Create reusable shipping rules for {shop.shopName}. New products can use these profiles immediately.
          </p>
        </div>
        <Link href="/seller/listings/new" className="shrink-0 rounded-full border border-clay px-5 py-3 text-center font-bold text-clay hover:bg-clay hover:text-white">
          Add product
        </Link>
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form action={createShippingProfile} className="min-w-0 rounded-3xl border border-sand bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-2xl font-bold">Create profile</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/65">
            Use one profile for many products. Countries selected below will be blocked at cart and checkout later.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Profile name *</span>
              <input name="profileName" required className="w-full rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="International Handmade Decor Shipping" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">Ships from country *</span>
              <select name="shipsFromCountry" required defaultValue="TR" className="w-full rounded-2xl border border-sand p-3 outline-none focus:border-clay">
                {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-bold leading-5">Processing min days</span>
                <input name="processingTimeMin" type="number" min="0" step="1" defaultValue="3" className="w-full rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
              </label>
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-bold leading-5">Processing max days</span>
                <input name="processingTimeMax" type="number" min="0" step="1" defaultValue="5" className="w-full rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
              </label>
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-bold leading-5">Domestic price</span>
                <input name="domesticShippingPrice" type="number" min="0" step="0.01" placeholder="9.90" className="w-full rounded-2xl border border-sand p-3 outline-none focus:border-clay" />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold">Estimated delivery text</span>
              <input name="estimatedDeliveryText" className="w-full rounded-2xl border border-sand p-3 outline-none focus:border-clay" placeholder="Ships in 3–5 business days" />
            </label>

            <div className="grid gap-3 rounded-2xl bg-cream p-4">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="internationalShippingEnabled" type="checkbox" defaultChecked className="size-4 shrink-0" />
                <span>Enable international shipping</span>
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input name="freeShippingEnabled" type="checkbox" className="size-4 shrink-0" />
                <span>Offer free shipping</span>
              </label>
            </div>

            <section className="grid gap-3">
              <div>
                <h3 className="font-bold">Countries I do not ship to</h3>
                <p className="mt-1 text-sm text-charcoal/60">Select countries to exclude from this shipping profile.</p>
              </div>
              <div className="grid max-h-72 gap-2 overflow-auto rounded-2xl border border-sand p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-2">
                {COUNTRY_OPTIONS.map((country) => (
                  <label key={country.code} className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 text-sm hover:bg-cream">
                    <input name="excludedCountries" type="checkbox" value={`${country.code}|${country.name}`} defaultChecked={suggestedExcludedCodes.has(country.code)} className="shrink-0" />
                    <span className="truncate">{country.name}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <button className="mt-5 w-full rounded-full bg-clay px-5 py-3 font-bold text-white shadow-sm hover:bg-clay/90 sm:w-auto">
            Save shipping profile
          </button>
        </form>

        <section className="grid min-w-0 gap-4">
          <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-2xl font-bold">Saved profiles</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/65">These profiles are loaded from Supabase through Prisma.</p>
          </div>

          {shippingProfiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sand bg-white p-6 text-charcoal/70">No shipping profiles yet. Create your first profile above.</div>
          ) : (
            shippingProfiles.map((profile) => (
              <article key={profile.id} className="min-w-0 rounded-3xl border border-sand bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-2xl font-bold leading-tight">{profile.profileName}</h3>
                    <p className="mt-2 leading-6 text-charcoal/70">
                      Ships from {profile.shipsFromCountry} · {profile.processingTimeMin}–{profile.processingTimeMax} business days
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cream px-4 py-2 text-sm font-bold text-clay">
                    {profile._count.products} product{profile._count.products === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="min-w-0 rounded-2xl bg-cream p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/50">Domestic price</p>
                    <p className="mt-2 break-words text-lg font-bold">{profile.freeShippingEnabled ? "Free shipping" : money(profile.domesticShippingPrice)}</p>
                  </div>
                  <div className="min-w-0 rounded-2xl bg-cream p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/50">International</p>
                    <p className="mt-2 break-words text-lg font-bold">{profile.internationalShippingEnabled ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div className="min-w-0 rounded-2xl bg-cream p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/50">Delivery note</p>
                    <p className="mt-2 break-words text-lg font-bold leading-6">{profile.estimatedDeliveryText ?? "Not set"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-sand p-4">
                  <p className="font-bold">Excluded countries</p>
                  {profile.excludedCountries.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.excludedCountries.map((country) => (
                        <span key={country.id} className="rounded-full bg-cream px-3 py-1 text-sm text-charcoal/70">{country.countryName}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-charcoal/60">No countries excluded.</p>
                  )}
                </div>

                <form action={deleteShippingProfile} className="mt-5">
                  <input type="hidden" name="profileId" value={profile.id} />
                  <button className="rounded-full border border-sand px-4 py-2 text-sm font-bold text-charcoal/65 hover:border-clay hover:text-clay">Delete profile</button>
                </form>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
