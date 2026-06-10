import { NextRequest, NextResponse } from "next/server";
import { getCartPageData } from "@/lib/cart";
import { getCheckoutPaymentReadiness } from "@/lib/stripe-connect";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") ?? "DE";
  const cart = await getCartPageData(country);
  const readiness = await getCheckoutPaymentReadiness(cart.groups.map((group) => group.shopId));

  return NextResponse.json({
    country: cart.selectedCountryCode,
    canCheckout: cart.canCheckout,
    blockedItems: cart.blockedItems.map((item) => item.product.title),
    paymentReadiness: readiness,
    total: cart.total
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const country = typeof body.country === "string" ? body.country : "DE";
  const cart = await getCartPageData(country);
  const readiness = await getCheckoutPaymentReadiness(cart.groups.map((group) => group.shopId));

  return NextResponse.json({
    message: "Checkout API preview is ready. The form action creates demo paid orders or real Stripe sessions.",
    country: cart.selectedCountryCode,
    canCheckout: cart.canCheckout,
    paymentReadiness: readiness,
    total: cart.total
  });
}
