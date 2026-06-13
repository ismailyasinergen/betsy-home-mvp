import { ReferenceMediaGallery } from "@/components/reference-media-gallery";
import type { ReactNode } from "react";
import { CurrencyPrice } from "@/components/currency-price";
import Link from "next/link";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible";
}

function money(value: unknown) {
  return Number(value).toFixed(2);
}

export default async function AccountProjectsPage() {
  const user = await requireSignedIn("/account/projects");

  const projects = await prisma.businessProjectRequest.findMany({
    where: { buyerId: user.id },
    include: {
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
    <>
      <SiteHeader />
      <main className="bg-cream">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-clay">Projects</p>
            <h1 className="mt-3 text-3xl font-extrabold text-charcoal">My business project requests</h1>
          </div>
          <Link href="/business/request" className="rounded-full bg-charcoal px-6 py-3 text-sm font-bold text-white">
            New project request
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {projects.length === 0 ? (
            <div className="rounded-3xl border border-sand bg-white p-8 text-center">
              <h2 className="text-xl font-extrabold text-charcoal">No project requests yet</h2>
              <p className="mt-2 text-sm text-charcoal/70">Create a bulk request for your next interior or business project.</p>
            </div>
          ) : (
            projects.map((project) => (
              <article key={project.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">{project.status.replaceAll("_", " ")}</p>
                    <h2 className="mt-2 text-xl font-extrabold text-charcoal">{project.projectName}</h2>
                    <p className="mt-2 text-sm text-charcoal/70">{project.quantitySummary}</p>
                    <p className="mt-3 text-sm leading-6 text-charcoal/70">{project.message}</p>
                  <ReferenceMediaGallery media={(project as any).referenceMedia} className="mt-4" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal/70">
                      Needed by: <strong className="text-charcoal">{formatDate(project.neededBy)}</strong>
                    </div>
                    <Link
                      href={`/account/projects/${project.id}`}
                      className="rounded-full bg-charcoal px-5 py-3 text-center text-sm font-bold text-white"
                    >
                      View request
                    </Link>
                    <Link
                      href={`/account/projects/${project.id}/edit`}
                      className="rounded-full border border-clay px-5 py-3 text-center text-sm font-bold text-clay"
                    >
                      Edit request
                    </Link>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-cream p-5">
                  <h3 className="font-extrabold text-charcoal">Seller offers</h3>

                  {project.quotes.length === 0 ? (
                    <p className="mt-2 text-sm text-charcoal/70">
                      No seller quotes yet. Sellers will see your request in Seller Studio.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {project.quotes.map((quote) => (
                        <div key={quote.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-bold text-charcoal">
                                {quote.shopName || quote.seller.name || quote.seller.email}
                              </p>
                              <p className="mt-1 text-charcoal/70">
                                Production: {quote.productionDays ? `${quote.productionDays} days` : "Not specified"} · Shipping: {quote.shippingPrice ? <CurrencyPrice amount={Number(quote.shippingPrice)} /> : "Not specified"}
                              </p>
                            </div>
                            <p className="text-xl font-black text-charcoal"><CurrencyPrice amount={Number(quote.totalPrice ?? 0)} /></p>
                          </div>
                          <p className="mt-3 leading-6 text-charcoal/70">{quote.message}</p>
                          <a href={`mailto:${quote.seller.email}?subject=${encodeURIComponent(`Betsy Home project quote: ${project.projectName}`)}`} className="mt-4 inline-flex rounded-full border border-clay px-4 py-2 text-xs font-bold text-clay">
                            Message seller
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      </main>
    </>
  );
}
