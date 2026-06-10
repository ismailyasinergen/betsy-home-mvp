import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { setAuthUserId } from "@/lib/auth";
import { verifyEmailToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  "missing-token": "The verification link is missing its token.",
  "invalid-token": "This verification link is invalid.",
  "used-token": "This verification link has already been used.",
  "expired-token": "This verification link has expired. Please request a new one."
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token ?? "";

  if (!token) {
    return <VerificationResult ok={false} message={errorMessages["missing-token"]} />;
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    return <VerificationResult ok={false} message={errorMessages[result.reason] ?? "This verification link could not be used."} email={"email" in result ? result.email : undefined} />;
  }

  await setAuthUserId(result.user.id);

  return <VerificationResult ok={true} message="Your email is verified. You are now signed in." />;
}

function VerificationResult({ ok, message, email }: { ok: boolean; message: string; email?: string }) {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-12">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-sand bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">Email verification</p>
          <h1 className="mt-2 text-4xl font-bold">{ok ? "Verified" : "Verification issue"}</h1>
          <p className="mt-4 text-charcoal/70">{message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ok ? (
              <Link href="/account" className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Go to my account</Link>
            ) : (
              <Link href={email ? `/check-email?email=${encodeURIComponent(email)}` : "/check-email"} className="rounded-full bg-clay px-6 py-3 font-bold text-white shadow-soft">Request a new link</Link>
            )}
            <Link href="/" className="rounded-full border border-clay px-6 py-3 font-bold text-clay">Back home</Link>
          </div>
        </section>
      </main>
    </>
  );
}
