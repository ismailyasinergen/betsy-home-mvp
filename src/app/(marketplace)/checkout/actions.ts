"use server";

import { PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCartPageData } from "@/lib/cart";
import { createPendingOrdersFromCart, getOrdersByNumbers, getShippingAddressFromForm } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { createStripeCheckoutSessionForOrders, getCheckoutPaymentReadiness, markOrdersPaidByNumbers } from "@/lib/stripe-connect";

export async function validateCheckoutAndContinueAction(formData: FormData) {
  const country = String(formData.get("country") ?? "DE");
  const cart = await getCartPageData(country);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  if (!cart.canCheckout) {
    redirect(`/checkout?country=${cart.selectedCountryCode}&blocked=1`);
  }

  redirect(`/checkout?country=${cart.selectedCountryCode}&ready=1`);
}

export async function createPendingOrderAction(formData: FormData) {
  const country = String(formData.get("country") ?? "DE");
  const cart = await getCartPageData(country);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  if (!cart.canCheckout) {
    redirect(`/checkout?country=${cart.selectedCountryCode}&blocked=1`);
  }

  const shippingAddress = getShippingAddressFromForm(formData, cart.selectedCountryCode, cart.selectedCountryName);
  const result = await createPendingOrdersFromCart(cart.selectedCountryCode, shippingAddress);

  if (!result.ok) {
    if (result.reason === "blocked_shipping") {
      redirect(`/checkout?country=${result.selectedCountryCode}&blocked=1`);
    }

    redirect("/cart");
  }

  redirect(`/checkout/success?orders=${encodeURIComponent(result.orderNumbers.join(","))}`);
}

export async function createDemoPaidOrderAction(formData: FormData) {
  const country = String(formData.get("country") ?? "DE");
  const cart = await getCartPageData(country);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  if (!cart.canCheckout) {
    redirect(`/checkout?country=${cart.selectedCountryCode}&blocked=1`);
  }

  const readiness = await getCheckoutPaymentReadiness(cart.groups.map((group) => group.shopId));

  if (!readiness.canUseDemoStripe) {
    redirect(`/checkout?country=${cart.selectedCountryCode}&ready=1&payment=connect-demo-first`);
  }

  const shippingAddress = getShippingAddressFromForm(formData, cart.selectedCountryCode, cart.selectedCountryName);
  const result = await createPendingOrdersFromCart(cart.selectedCountryCode, shippingAddress);

  if (!result.ok) {
    if (result.reason === "blocked_shipping") {
      redirect(`/checkout?country=${result.selectedCountryCode}&blocked=1`);
    }

    redirect("/cart");
  }

  await markOrdersPaidByNumbers(result.orderNumbers, "demo_checkout_session");
  redirect(`/checkout/success?orders=${encodeURIComponent(result.orderNumbers.join(","))}&stripe=demo-paid`);
}

export async function createStripeCheckoutSessionAction(formData: FormData) {
  const country = String(formData.get("country") ?? "DE");
  const cart = await getCartPageData(country);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  if (!cart.canCheckout) {
    redirect(`/checkout?country=${cart.selectedCountryCode}&blocked=1`);
  }

  const readiness = await getCheckoutPaymentReadiness(cart.groups.map((group) => group.shopId));

  if (!readiness.canUseRealStripe) {
    redirect(`/checkout?country=${cart.selectedCountryCode}&ready=1&payment=not-ready`);
  }

  const shippingAddress = getShippingAddressFromForm(formData, cart.selectedCountryCode, cart.selectedCountryName);
  const result = await createPendingOrdersFromCart(cart.selectedCountryCode, shippingAddress);

  if (!result.ok) {
    if (result.reason === "blocked_shipping") {
      redirect(`/checkout?country=${result.selectedCountryCode}&blocked=1`);
    }

    redirect("/cart");
  }

  const checkoutUrl = await createStripeCheckoutSessionForOrders(result.orderNumbers);
  redirect(checkoutUrl);
}

export async function markOrderPaidForTestingAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();

  if (!orderNumber) {
    redirect("/seller/orders");
  }

  const orders = await getOrdersByNumbers([orderNumber]);

  if (orders.length === 0) {
    redirect("/seller/orders");
  }

  await prisma.order.updateMany({
    where: {
      orderNumber
    },
    data: {
      paymentStatus: PaymentStatus.PAID
    }
  });

  redirect("/seller/orders");
}
