import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { signInDemoAccount, signInWithPassword } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Email or password was not correct.",
  unverified: "Please verify your email before signing in. Check your inbox or request a new verification link.",
  "google-config": "Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.",
  "google-state": "Google login could not be completed safely. Please try again.",
  "google-token": "Google did not return a valid login token. Please try again.",
  "google-profile": "We could not read your Google profile. Please try again.",
  "google-unverified": "Google did not confirm this email address as verified. Please use another login method."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next ?? "";
  const error = params.error;
  const message = error ? errorMessages[error] : null;
  const googleHref = next ? `/login/google?next=${encodeURIComponent(next)}` : "/login/google";

  return (
    <>
      <SiteHeader />
      <main className="container-page py-12">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Sign in</p>
            <h1 className="mt-2 text-4xl font-bold">Access your Betsy Home account</h1>
            <p className="mt-3 text-charcoal/65">Use email/password, Google login, or demo buttons while we continue building the MVP.</p>

            {message ? (
              <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{message}</div>
            ) : null}

            <Link href={googleHref} className="mt-6 flex w-full items-center justify-center rounded-full border border-sand bg-white px-6 py-3 text-center font-bold text-charcoal shadow-sm hover:border-clay hover:text-clay">
              Continue with Google
            </Link>

            <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-charcoal/40">
              <span className="h-px flex-1 bg-sand" />
              or
              <span className="h-px flex-1 bg-sand" />
            </div>

            <form action={signInWithPassword} className="grid gap-4">
              <input type="hidden" name="next" value={next} />
              <label className="grid gap-2 text-sm font-semibold">
                Email
                <input name="email" type="email" required className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="you@example.com" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Password
                <input name="password" type="password" required className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="At least 8 characters" />
              </label>
              <button className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Sign in</button>
            </form>

            <p className="mt-5 text-sm text-charcoal/65">New customer? <Link href="/register" className="font-bold text-clay">Create an account</Link>.</p>
            <p className="mt-2 text-sm text-charcoal/65">Need another verification link? <Link href="/check-email" className="font-bold text-clay">Resend verification</Link>.</p>
          </section>

          <aside className="rounded-[2rem] border border-sand bg-cream p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">MVP demo access</p>
            <h2 className="mt-2 text-3xl font-bold">Quick sign-in</h2>
            <p className="mt-3 text-sm leading-6 text-charcoal/65">These buttons let you test customer, seller, and admin workflows. Demo accounts are automatically verified.</p>
            <div className="mt-6 grid gap-3">
              <form action={signInDemoAccount}>
                <input type="hidden" name="role" value="CUSTOMER" />
                <button className="w-full rounded-full bg-white px-5 py-3 font-bold text-charcoal shadow-sm hover:text-clay">Continue as Demo Customer</button>
              </form>
              <form action={signInDemoAccount}>
                <input type="hidden" name="role" value="SELLER" />
                <button className="w-full rounded-full bg-white px-5 py-3 font-bold text-charcoal shadow-sm hover:text-clay">Continue as Demo Seller</button>
              </form>
              <form action={signInDemoAccount}>
                <input type="hidden" name="role" value="ADMIN" />
                <button className="w-full rounded-full bg-charcoal px-5 py-3 font-bold text-white shadow-sm">Continue as Demo Admin</button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
