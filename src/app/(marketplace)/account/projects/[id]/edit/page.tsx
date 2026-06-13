import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBusinessProjectRequest } from "./actions";

export const dynamic = "force-dynamic";

function dateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditBusinessProjectRequestPage({
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
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <>
      <SiteHeader />

      <main className="bg-cream">
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-clay">
                  Edit Business Project
                </p>
                <h1 className="mt-4 text-3xl font-extrabold text-charcoal">
                  Update your project request
                </h1>
                <p className="mt-3 text-sm leading-6 text-charcoal/70">
                  Changes will be visible to sellers and admins reviewing this
                  bulk/project request.
                </p>
              </div>

              <Link
                href="/account/projects"
                className="rounded-full border border-clay px-5 py-3 text-sm font-bold text-clay"
              >
                Back
              </Link>
            </div>

            <form action={updateBusinessProjectRequest.bind(null, project.id)} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-charcoal">Project name *</span>
                <input
                  name="projectName"
                  required
                  defaultValue={project.projectName}
                  className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-charcoal">Company name</span>
                  <input
                    name="companyName"
                    defaultValue={project.companyName ?? ""}
                    className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-charcoal">Business type</span>
                  <input
                    name="businessType"
                    defaultValue={project.businessType ?? ""}
                    className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-charcoal">Project location</span>
                  <input
                    name="projectLocation"
                    defaultValue={project.projectLocation ?? ""}
                    className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-charcoal">Needed by</span>
                  <input
                    type="date"
                    name="neededBy"
                    defaultValue={dateInputValue(project.neededBy)}
                    className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-charcoal">Budget range</span>
                <input
                  name="budgetRange"
                  defaultValue={project.budgetRange ?? ""}
                  className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-charcoal">Categories needed</span>
                <input
                  name="categories"
                  defaultValue={project.categories.join(", ")}
                  className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-charcoal">Quantity needed *</span>
                <input
                  name="quantitySummary"
                  required
                  defaultValue={project.quantitySummary}
                  className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-charcoal">Project details *</span>
                <textarea
                  name="message"
                  required
                  rows={6}
                  defaultValue={project.message}
                  className="mt-2 w-full rounded-2xl border border-sand px-4 py-3"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-clay px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-clay/90"
              >
                Save changes
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
