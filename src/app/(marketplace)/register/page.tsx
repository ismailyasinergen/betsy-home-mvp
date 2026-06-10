import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { registerCustomer } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  exists: "An account with that email already exists. Please sign in instead.",
  "short-password": "Password must be at least 8 characters.",
  "invalid-email": "Please enter a valid email address.",
  "blocked-email-domain": "Please use a real personal or business email address, not a test/fake domain.",
  "disposable-email": "Temporary or disposable email addresses are not allowed.",
  "role-email": "Please use your own email address instead of a shared address like info@, support@, or admin@.",
  "email-domain-not-found": "That email domain does not appear able to receive mail. Please check the spelling or use another address.",
  "email-check-failed": "We could not verify the email domain right now. Please try again in a moment."
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error;
  const message = error ? errorMessages[error] : null;

  return (
    <>
      <SiteHeader />
      <main className="container-page py-12">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Create account</p>
          <h1 className="mt-2 text-4xl font-bold">Join Betsy Home</h1>
          <p className="mt-3 text-charcoal/65">Create a customer account for orders, reviews, favorites, mood boards, custom requests, and messages.</p>

          {message ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{message}</div>
          ) : null}

          <Link href="/login/google?next=/account" className="mt-6 flex w-full items-center justify-center rounded-full border border-sand bg-white px-6 py-3 text-center font-bold text-charcoal shadow-sm hover:border-clay hover:text-clay">
            Continue with Google
          </Link>

          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-charcoal/40">
            <span className="h-px flex-1 bg-sand" />
            or create with email
            <span className="h-px flex-1 bg-sand" />
          </div>

          <div className="rounded-3xl border border-sand bg-cream p-4 text-sm text-charcoal/70">
            <strong>Registration protection:</strong> Betsy Home checks duplicate emails, rejects temporary/fake domains, and requires verification before account access. Google login uses Google’s verified email signal when available.
          </div>

          <form action={registerCustomer} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Name
              <input name="name" className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="Your name" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input name="email" type="email" required className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="you@example.com" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Password
              <input name="password" type="password" required minLength={8} className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="At least 8 characters" />
            </label>
            <button className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Create customer account</button>
          </form>

          <p className="mt-5 text-sm text-charcoal/65">Already have an account? <Link href="/login" className="font-bold text-clay">Sign in</Link>.</p>
        </section>
      </main>
    </>
  );
}
