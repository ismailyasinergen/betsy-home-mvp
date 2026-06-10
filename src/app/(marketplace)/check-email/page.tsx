import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { resendVerificationEmail } from "@/lib/auth-actions";
import { buildVerificationPath } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; devToken?: string; sent?: string; error?: string }> }) {
  const params = await searchParams;
  const email = params.email ?? "";
  const devToken = params.devToken ?? "";
  const sent = params.sent === "1";
  const error = params.error;
  const devVerificationPath = devToken ? buildVerificationPath(devToken) : "";

  return (
    <>
      <SiteHeader />
      <main className="container-page py-12">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-sand bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Verify email</p>
          <h1 className="mt-2 text-4xl font-bold">Check your email</h1>
          <p className="mt-3 text-charcoal/65">Before account access, Betsy Home needs to confirm that the email address belongs to you.</p>

          {error === "unverified" || error === "verify-required" ? (
            <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">This account is not verified yet. Please use the verification link or request a new one.</div>
          ) : null}

          {sent ? (
            <div className="mt-5 rounded-3xl border border-sage/30 bg-sage/10 p-4 text-sm font-semibold text-sage">If that account exists and is not verified, a new verification link was created.</div>
          ) : null}

          <div className="mt-6 rounded-3xl border border-sand bg-cream p-5 text-sm leading-6 text-charcoal/70">
            <p><strong>Email:</strong> {email || "Enter your email below to request a new link."}</p>
            <p className="mt-2">Production version: this link will be sent by email using a provider such as Resend, Postmark, SendGrid, or Amazon SES.</p>
          </div>

          {devVerificationPath ? (
            <div className="mt-5 rounded-3xl border border-dashed border-clay bg-white p-5">
              <p className="text-sm font-bold text-clay">Development verification link</p>
              <p className="mt-2 text-sm text-charcoal/65">For local testing only, click this instead of checking an inbox.</p>
              <Link href={devVerificationPath} className="mt-4 inline-flex rounded-full bg-clay px-5 py-3 font-bold text-white shadow-soft">Verify email now</Link>
            </div>
          ) : null}

          <form action={resendVerificationEmail} className="mt-6 grid gap-3 rounded-3xl border border-sand bg-white p-5">
            <label className="grid gap-2 text-sm font-semibold">
              Resend verification link
              <input name="email" type="email" required defaultValue={email} className="rounded-2xl border border-sand bg-cream px-4 py-3 outline-none focus:border-clay" placeholder="you@example.com" />
            </label>
            <button className="rounded-full bg-charcoal px-5 py-3 font-bold text-white">Resend verification</button>
          </form>

          <p className="mt-5 text-sm text-charcoal/65"><Link href="/login" className="font-bold text-clay">Back to sign in</Link></p>
        </section>
      </main>
    </>
  );
}
