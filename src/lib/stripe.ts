import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function getPlatformFeeAmount(amountInCents: number) {
  const feePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "10");
  return Math.round(amountInCents * (feePercent / 100));
}
