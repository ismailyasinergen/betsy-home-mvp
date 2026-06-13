import { createBusinessProjectRequest } from "./actions";
import { BusinessRequestMediaInput } from "@/components/business-request-media-input";
import { SiteHeader } from "@/components/site-header";

export default function BusinessRequestPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-clay">
            Business Project Request
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-charcoal">
            Tell sellers what you need in bulk
          </h1>
          <p className="mt-3 text-sm leading-6 text-charcoal/70">
            Use this form for hotel, cafe, restaurant, shop, office, or interior
            design projects.
          </p>

          <form action={createBusinessProjectRequest} encType="multipart/form-data" className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-charcoal">Project name *</span>
              <input name="projectName" required className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Boutique hotel lobby refresh" />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-charcoal">Company name</span>
                <input name="companyName" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Your business name" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-charcoal">Business type</span>
                <input name="businessType" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Interior designer, hotel, cafe..." />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-charcoal">Project location</span>
                <input name="projectLocation" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Berlin, Germany" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-charcoal">Needed by</span>
                <input type="date" name="neededBy" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-charcoal">Budget range</span>
              <input name="budgetRange" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="$2,000–$5,000 or €2,000–€5,000" />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-charcoal">Categories needed</span>
              <input name="categories" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Ceramics, wall art, lamps, textiles" />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-charcoal">Quantity needed *</span>
              <input name="quantitySummary" required className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="40 ceramic cups, 20 wall art pieces, 12 lamps..." />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-charcoal">Project details *</span>
              <textarea name="message" required rows={6} className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Describe style, colors, materials, customization, delivery needs, and anything sellers should know." />
            </label>

            
              <BusinessRequestMediaInput />

              <p className="text-xs leading-5 text-charcoal/50">
                By uploading files, you confirm you have the right to share them for this project request.
              </p>

<button type="submit" className="w-full rounded-full bg-clay px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-clay/90">
              Submit project request
            </button>
          </form>
        </div>
      </section>
      </main>
    </>
  );
}
