import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  return date
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "Flexible";
}

function money(value: unknown) {
  return `$${Number(value).toFixed(2)}`;
}

export default async function BusinessProjectRequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSignedIn("/account/projects");
  const { id } = await params;

  const project = await prisma.businessProjectRequest.findFirst({
    where: {
      id,
      buyerId: user.id
    },
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
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <>
      <SiteHeader />

      <main className="bg-cream">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/account/projects" className="text-sm font-bold text-clay">
                ← Back to business projects
              </Link>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.35em] text-clay">
                Published Request
              </p>
              <h1 className="mt-3 text-3xl font-extrabold text-charcoal">
                {project.projectName}
              </h1>
            </div>

            <Link
              href={`/account/projects/${project.id}/edit`}
              className="rounded-full bg-clay px-6 py-3 text-sm font-bold text-white shadow-sm"
            >
              Edit request
            </Link>
          </div>

          <article className="rounded-[2rem] border border-sand bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">
                  {project.status.replaceAll("_", " ")}
                </p>
                <p className="mt-3 text-sm text-charcoal/70">
                  Created request for bulk/project buying.
                </p>
              </div>

              <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal/70">
                Needed by: <strong className="text-charcoal">{formatDate(project.neededBy)}</strong>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Info label="Company" value={project.companyName || "Not specified"} />
              <Info label="Business type" value={project.businessType || "Not specified"} />
              <Info label="Location" value={project.projectLocation || "Not specified"} />
              <Info label="Budget" value={project.budgetRange || "Not specified"} />
              <Info label="Quantity needed" value={project.quantitySummary} />
              <Info label="Categories" value={project.categories.length ? project.categories.join(", ") : "Not specified"} />
            </div>

            <div className="mt-6 rounded-3xl bg-cream p-5">
              <h2 className="font-extrabold text-charcoal">Project details</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-charcoal/70">
                {project.message}
              </p>
            </div>

            <div className="mt-6 rounded-3xl bg-cream p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-extrabold text-charcoal">Seller offers</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-clay">
                  {project.quotes.length} offer{project.quotes.length === 1 ? "" : "s"}
                </span>
              </div>

              {project.quotes.length === 0 ? (
                <p className="mt-3 text-sm text-charcoal/70">
                  No seller quotes yet. Sellers will see this request in Seller Studio.
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
                            Production: {quote.productionDays ? `${quote.productionDays} days` : "Not specified"} · Shipping: {quote.shippingPrice ? money(quote.shippingPrice) : "Not specified"}
                          </p>
                        </div>
                        <p className="text-xl font-black text-charcoal">{money(quote.totalPrice)}</p>
                      </div>

                      <p className="mt-3 leading-6 text-charcoal/70">{quote.message}</p>

                      <a
                        href={`mailto:${quote.seller.email}?subject=${encodeURIComponent(`Betsy Home project quote: ${project.projectName}`)}`}
                        className="mt-4 inline-flex rounded-full border border-clay px-4 py-2 text-xs font-bold text-clay"
                      >
                        Message seller
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/50">
        {label}
      </p>
      <p className="mt-2 font-semibold text-charcoal">{value}</p>
    </div>
  );
}
