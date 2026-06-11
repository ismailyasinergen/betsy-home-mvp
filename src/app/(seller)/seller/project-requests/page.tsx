import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible";
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
          Review bulk requests from hotels, cafes, shops, and interior designers.
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">{project.status.replaceAll("_", " ")}</p>
                  <h2 className="mt-2 text-xl font-extrabold text-charcoal">{project.projectName}</h2>
                  <p className="mt-2 text-sm text-charcoal/70">{project.companyName || "Business buyer"} · {project.businessType || "Project buyer"}</p>
                  <p className="mt-3 text-sm font-bold text-charcoal">Quantity: {project.quantitySummary}</p>
                  <p className="mt-3 text-sm leading-6 text-charcoal/70">{project.message}</p>
                  {project.categories.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.categories.map((category) => (
                        <span key={category} className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-charcoal/70">
                          {category}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="min-w-64 rounded-2xl bg-cream p-4 text-sm text-charcoal/70">
                  <p>Needed by: <strong className="text-charcoal">{formatDate(project.neededBy)}</strong></p>
                  <p className="mt-2">Budget: <strong className="text-charcoal">{project.budgetRange || "Not specified"}</strong></p>
                  <p className="mt-2">Location: <strong className="text-charcoal">{project.projectLocation || "Not specified"}</strong></p>
                  <a href={`mailto:${project.buyer.email}?subject=${encodeURIComponent(`Betsy Home project quote: ${project.projectName}`)}`} className="mt-4 inline-flex rounded-full bg-charcoal px-5 py-3 text-xs font-bold text-white">
                    Contact buyer
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
