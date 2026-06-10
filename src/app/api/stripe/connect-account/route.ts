import { NextResponse } from "next/server";
import { createSellerStripeOnboardingLink } from "@/lib/stripe-connect";

export async function POST() {
  try {
    const url = await createSellerStripeOnboardingLink();
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create Stripe onboarding link." },
      { status: 500 }
    );
  }
}
