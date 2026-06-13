import { ReferenceMediaGallery } from "@/components/reference-media-gallery";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitBusinessProjectQuote } from "./actions";

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible";
}

function money(value: unknown) {
  return `$${Number(value).toFixed(2)}`;
}

export default async function SellerProjectRequestsPage() {
  await requireRole([UserRole.SELLER, UserRole.ADMIN], "/seller/project-requests");

  const projects = await prisma.businessProjectRequest.findMany({
    include: {
      buyer: {
        select: {
          name: true,
          email: true
        }
      },
      quotes: {
        include: {
          seller: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-clay">Wholesale</p>
        <h1 className="mt-3 text-3xl font-extrabold text-charcoal">Business project requests</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Review bulk requests and send a quote directly from Seller Studio.
        </p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="rounded-3xl border border-sand bg-white p-8 text-center">
            <h2 className="text-xl font-extrabold text-charcoal">No business requests yet</h2>
          </div>
        ) : (
          projects.map((project) => (
            <article key={project.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">{project.status.replaceAll("_", " ")}</p>
                  <h2 className="mt-2 text-xl font-extrabold text-charcoal">{project.projectName}</h2>
                  <p className="mt-2 text-sm text-charcoal/70">
                    {project.companyName || "Business buyer"} · {project.businessType || "Project buyer"}
                  </p>
                  <p className="mt-3 text-sm font-bold text-charcoal">Quantity: {project.quantitySummary}</p>
                  <p className="mt-3 text-sm leading-6 text-charcoal/70">{project.message}</p>
                  <ReferenceMediaGallery media={(project as any).referenceMedia} className="mt-4" />

                  {project.categories.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.categories.map((category) => (
                        <span key={category} className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-charcoal/70">
                          {category}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-3 rounded-2xl bg-cream p-4 text-sm text-charcoal/70 md:grid-cols-3">
                    <p>Needed by: <strong className="text-charcoal">{formatDate(project.neededBy)}</strong></p>
                    <p>Budget: <strong className="text-charcoal">{project.budgetRange || "Not specified"}</strong></p>
                    <p>Location: <strong className="text-charcoal">{project.projectLocation || "Not specified"}</strong></p>
                  </div>

                  {project.quotes.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      <h3 className="font-extrabold text-charcoal">Quotes sent</h3>
                      {project.quotes.map((quote) => (
                        <div key={quote.id} className="rounded-2xl border border-sand p-4 text-sm">
                          <p className="font-bold text-charcoal">
                            {quote.shopName || quote.seller.name || quote.seller.email} · {money(quote.totalPrice)}
                          </p>
                          <p className="mt-1 text-charcoal/70">
                            Shipping: {quote.shippingPrice ? money(quote.shippingPrice) : "Not specified"} · Production: {quote.productionDays ? `${quote.productionDays} days` : "Not specified"}
                          </p>
                          <p className="mt-2 text-charcoal/70">{quote.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <form action={submitBusinessProjectQuote.bind(null, project.id)} className="rounded-3xl bg-cream p-5">
                  <h3 className="text-lg font-extrabold text-charcoal">Send quote</h3>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-charcoal">Total price *</span>
                    <input name="totalPrice" required type="number" min="1" step="0.01" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="2500" />
                  </label>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-charcoal">Shipping price</span>
                    <input name="shippingPrice" type="number" min="0" step="0.01" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="150" />
                  </label>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-charcoal">Production days</span>
                    <input name="productionDays" type="number" min="1" step="1" className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="21" />
                  </label>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-charcoal">Message *</span>
                    <textarea name="message" required rows={5} className="mt-2 w-full rounded-2xl border border-sand px-4 py-3" placeholder="Tell the buyer what you can produce, timeline, customization options, and terms." />
                  </label>

                  <button type="submit" className="mt-5 w-full rounded-full bg-charcoal px-5 py-3 text-sm font-bold text-white">
                    Send quote to buyer
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
