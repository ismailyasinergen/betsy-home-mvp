import Link from "next/link";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible";
}

export default async function AccountProjectsPage() {
  const user = await requireSignedIn("/account/projects");

  const projects = await prisma.businessProjectRequest.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
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
                  </div>
                  <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-charcoal/70">
                    Needed by: <strong className="text-charcoal">{formatDate(project.neededBy)}</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
