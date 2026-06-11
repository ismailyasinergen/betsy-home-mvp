import Link from "next/link";

export default function BusinessPage() {
  return (
    <main className="bg-cream">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-stone-900 px-8 py-12 text-white md:px-14 md:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-100">
            For Business Buyers
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Source handmade pieces for hotels, cafes, shops, and interior projects.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-200">
            Create one project request and tell sellers what you need in bulk:
            quantities, budget, delivery date, categories, and custom details.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/business/request"
              className="rounded-full bg-white px-7 py-4 text-sm font-bold text-stone-950 transition hover:bg-stone-100"
            >
              Start a project request
            </Link>
            <Link
              href="/account/projects"
              className="rounded-full border border-white/30 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View my projects
            </Link>
          </div>
        </div>

        <div className="grid gap-6 py-12 md:grid-cols-3">
          {[
            ["1. Describe your project", "Tell us what you need, quantity, deadline, budget, and location."],
            ["2. Sellers review it", "Wholesale-ready sellers can review bulk and custom project requests."],
            ["3. Continue with quotes", "Use messaging and custom order workflows to agree on production and payment."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-charcoal">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
