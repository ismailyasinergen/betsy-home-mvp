"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSellerStripeConnection, connectDemoStripeAccount, createSellerStripeOnboardingLink } from "@/lib/stripe-connect";

export async function connectDemoStripeAccountAction() {
  await connectDemoStripeAccount();
  revalidatePath("/seller/payments");
  redirect("/seller/payments?demo=connected");
}

export async function clearSellerStripeConnectionAction() {
  await clearSellerStripeConnection();
  revalidatePath("/seller/payments");
  redirect("/seller/payments?cleared=1");
}

export async function startStripeOnboardingAction() {
  const url = await createSellerStripeOnboardingLink();
  redirect(url);
}
