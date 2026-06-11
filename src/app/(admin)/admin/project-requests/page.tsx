import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
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

export default async function AdminProjectRequestsPage() {
  await requireRole([UserRole.ADMIN], "/admin/project-requests");

  const projects = await prisma.businessProjectRequest.findMany({
    include: {
      buyer: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">
          Admin
        </p>
        <h1 className="mt-2 text-4xl font-bold text-charcoal">
          Business project requests
        </h1>
        <p className="mt-2 max-w-3xl text-charcoal/70">
          Review bulk buying requests from business buyers, hotels, cafes,
          shops, and interior designers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-charcoal/60">Total requests</p>
          <p className="mt-2 text-3xl font-bold text-charcoal">{projects.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-charcoal/60">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-clay">
            {projects.filter((project) => project.status === "SUBMITTED").length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-charcoal/60">Quoted</p>
          <p className="mt-2 text-3xl font-bold text-sage">
            {projects.filter((project) => project.status === "QUOTED").length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-charcoal/60">Accepted</p>
          <p className="mt-2 text-3xl font-bold text-charcoal">
            {projects.filter((project) => project.status === "ACCEPTED").length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="rounded-3xl border border-sand bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-charcoal">
              No business project requests yet
            </h2>
            <p className="mt-2 text-charcoal/60">
              Requests submitted from /business/request will appear here.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <article
              key={project.id}
              className="rounded-3xl border border-sand bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">
                    {project.status.replaceAll("_", " ")}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-charcoal">
                    {project.projectName}
                  </h2>

                  <p className="mt-2 text-sm text-charcoal/60">
                    Buyer: {project.buyer.name || "Unnamed buyer"} ·{" "}
                    {project.buyer.email}
                  </p>

                  <div className="mt-4 grid gap-3 text-sm text-charcoal/70 md:grid-cols-2">
                    <p>
                      <span className="font-bold text-charcoal">Company:</span>{" "}
                      {project.companyName || "Not specified"}
                    </p>
                    <p>
                      <span className="font-bold text-charcoal">Business type:</span>{" "}
                      {project.businessType || "Not specified"}
                    </p>
                    <p>
                      <span className="font-bold text-charcoal">Location:</span>{" "}
                      {project.projectLocation || "Not specified"}
                    </p>
                    <p>
                      <span className="font-bold text-charcoal">Needed by:</span>{" "}
                      {formatDate(project.neededBy)}
                    </p>
                    <p>
                      <span className="font-bold text-charcoal">Budget:</span>{" "}
                      {project.budgetRange || "Not specified"}
                    </p>
                    <p>
                      <span className="font-bold text-charcoal">Quantity:</span>{" "}
                      {project.quantitySummary}
                    </p>
                  </div>

                  {project.categories.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-charcoal/70"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-charcoal/70">
                    {project.message}
                  </p>
                </div>

                <div className="min-w-56 rounded-2xl bg-cream p-4 text-sm">
                  <p className="font-bold text-charcoal">Admin actions</p>
                  <a
                    href={`mailto:${project.buyer.email}?subject=${encodeURIComponent(
                      `Betsy Home business request: ${project.projectName}`
                    )}`}
                    className="mt-4 inline-flex rounded-full bg-charcoal px-5 py-3 text-xs font-bold text-white"
                  >
                    Email buyer
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
