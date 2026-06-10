import { PaymentStatus, ShippingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";
import { getPlatformFeeAmount, stripe } from "@/lib/stripe";

export function isDemoStripeAccount(stripeAccountId?: string | null) {
  return Boolean(stripeAccountId?.startsWith("acct_demo_"));
}

export async function getSellerPaymentDashboard() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      stripeConfigured: Boolean(stripe),
      stripeAccountId: null,
      isConnected: false,
      isDemoConnected: false,
      pendingGross: 0,
      paidGross: 0,
      platformFees: 0,
      sellerNet: 0,
      pendingOrders: 0,
      paidOrders: 0
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      shopId: shop.id
    },
    select: {
      total: true,
      platformFee: true,
      paymentStatus: true,
      shippingStatus: true
    }
  });

  const pendingOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PENDING && order.shippingStatus !== ShippingStatus.CANCELLED);
  const paidOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PAID);
  const pendingGross = pendingOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const paidGross = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const platformFees = paidOrders.reduce((sum, order) => sum + Number(order.platformFee), 0);
  const sellerNet = paidGross - platformFees;

  return {
    shop,
    stripeConfigured: Boolean(stripe),
    stripeAccountId: shop.stripeAccountId,
    isConnected: Boolean(shop.stripeAccountId),
    isDemoConnected: isDemoStripeAccount(shop.stripeAccountId),
    pendingGross,
    paidGross,
    platformFees,
    sellerNet,
    pendingOrders: pendingOrders.length,
    paidOrders: paidOrders.length
  };
}

export async function connectDemoStripeAccount() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop found. Run npm run seed first.");
  }

  const demoAccountId = shop.stripeAccountId?.startsWith("acct_demo_")
    ? shop.stripeAccountId
    : `acct_demo_${shop.id.slice(0, 10)}`;

  return prisma.shop.update({
    where: {
      id: shop.id
    },
    data: {
      stripeAccountId: demoAccountId
    }
  });
}

export async function clearSellerStripeConnection() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop found. Run npm run seed first.");
  }

  return prisma.shop.update({
    where: {
      id: shop.id
    },
    data: {
      stripeAccountId: null
    }
  });
}

export async function createSellerStripeOnboardingLink() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop found. Run npm run seed first.");
  }

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured. Use demo connect now, or add Stripe test keys to .env later.");
  }

  let stripeAccountId = shop.stripeAccountId;

  if (!stripeAccountId || isDemoStripeAccount(stripeAccountId)) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        shopId: shop.id,
        shopName: shop.shopName,
        platform: "betsy_home_mvp"
      }
    });

    stripeAccountId = account.id;

    await prisma.shop.update({
      where: {
        id: shop.id
      },
      data: {
        stripeAccountId
      }
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${siteUrl}/seller/payments?refresh=1`,
    return_url: `${siteUrl}/seller/payments?connected=1`,
    type: "account_onboarding"
  });

  return accountLink.url;
}

export async function getCheckoutPaymentReadiness(shopIds: string[]) {
  const uniqueShopIds = Array.from(new Set(shopIds));

  if (uniqueShopIds.length === 0) {
    return {
      stripeConfigured: Boolean(stripe),
      isMultiSellerCart: false,
      allSellersConnected: false,
      canUseDemoStripe: false,
      canUseRealStripe: false,
      connectedShopId: null as string | null,
      connectedStripeAccountId: null as string | null,
      missingSellerNames: [] as string[],
      message: "Add items to cart first."
    };
  }

  const shops = await prisma.shop.findMany({
    where: {
      id: {
        in: uniqueShopIds
      }
    },
    select: {
      id: true,
      shopName: true,
      stripeAccountId: true
    }
  });

  const missing = shops.filter((shop) => !shop.stripeAccountId);
  const isMultiSellerCart = uniqueShopIds.length > 1;
  const connectedShop = shops[0] ?? null;
  const connectedStripeAccountId = connectedShop?.stripeAccountId ?? null;
  const hasDemoAccount = isDemoStripeAccount(connectedStripeAccountId);
  const allSellersConnected = missing.length === 0 && shops.length === uniqueShopIds.length;
  const canUseDemoStripe = !isMultiSellerCart && allSellersConnected && hasDemoAccount;
  const canUseRealStripe = Boolean(stripe) && !isMultiSellerCart && allSellersConnected && Boolean(connectedStripeAccountId) && !hasDemoAccount;

  let message = "Ready for payment preparation.";

  if (isMultiSellerCart) {
    message = "This MVP payment flow supports one seller per checkout. Split multi-seller carts before Stripe is enabled.";
  } else if (!allSellersConnected) {
    message = "The seller must connect payments before checkout can take payment.";
  } else if (canUseDemoStripe) {
    message = "Demo Stripe account is connected. You can create a demo paid order without charging a real card.";
  } else if (!stripe && connectedStripeAccountId && !hasDemoAccount) {
    message = "Seller has a Stripe account ID, but STRIPE_SECRET_KEY is not configured locally.";
  } else if (canUseRealStripe) {
    message = "Real Stripe test checkout is ready. Use Stripe test keys only while developing.";
  }

  return {
    stripeConfigured: Boolean(stripe),
    isMultiSellerCart,
    allSellersConnected,
    canUseDemoStripe,
    canUseRealStripe,
    connectedShopId: connectedShop?.id ?? null,
    connectedStripeAccountId,
    missingSellerNames: missing.map((shop) => shop.shopName),
    message
  };
}

export async function createStripeCheckoutSessionForOrders(orderNumbers: string[]) {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const orders = await prisma.order.findMany({
    where: {
      orderNumber: {
        in: orderNumbers
      }
    },
    include: {
      shop: true,
      items: true
    }
  });

  if (orders.length !== 1) {
    throw new Error("This MVP Stripe flow supports exactly one seller order per checkout session.");
  }

  const order = orders[0];

  if (!order.shop.stripeAccountId || isDemoStripeAccount(order.shop.stripeAccountId)) {
    throw new Error("Seller needs a real Stripe connected account before real Stripe checkout can start.");
  }

  const amountInCents = Math.round(Number(order.total) * 100);
  const applicationFeeAmount = getPlatformFeeAmount(amountInCents);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(item.priceSnapshot) * 100),
        product_data: {
          name: item.titleSnapshot
        }
      }
    })),
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: order.shop.stripeAccountId
      }
    },
    metadata: {
      orderNumbers: orderNumbers.join(","),
      orderIds: orders.map((item) => item.id).join(","),
      shopId: order.shopId
    },
    success_url: `${siteUrl}/checkout/success?orders=${encodeURIComponent(orderNumbers.join(","))}&stripe=success`,
    cancel_url: `${siteUrl}/checkout?country=${encodeURIComponent(String((order.shippingAddress as { countryCode?: string } | null)?.countryCode ?? "DE"))}&payment=cancelled`
  });

  await prisma.order.updateMany({
    where: {
      orderNumber: {
        in: orderNumbers
      }
    },
    data: {
      stripeCheckoutSessionId: session.id
    }
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return session.url;
}


export async function confirmStripeCheckoutReturnAndMarkPaid(orderNumbers: string[]) {
  if (!stripe || orderNumbers.length === 0) {
    return { ok: false, reason: "stripe_not_configured_or_no_orders", updated: 0 };
  }

  const orders = await prisma.order.findMany({
    where: {
      orderNumber: {
        in: orderNumbers
      }
    },
    select: {
      orderNumber: true,
      stripeCheckoutSessionId: true,
      paymentStatus: true,
      shippingStatus: true
    }
  });

  const sessionId = orders.find((order) => order.stripeCheckoutSessionId)?.stripeCheckoutSessionId;

  if (!sessionId) {
    return { ok: false, reason: "missing_checkout_session", updated: 0 };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const metadataOrderNumbers = String(session.metadata?.orderNumbers ?? "")
    .split(",")
    .map((orderNumber) => orderNumber.trim())
    .filter(Boolean);

  const expected = new Set(orderNumbers);
  const metadataMatches = metadataOrderNumbers.length > 0 && metadataOrderNumbers.every((orderNumber) => expected.has(orderNumber));

  if (!metadataMatches) {
    return { ok: false, reason: "metadata_mismatch", updated: 0 };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, reason: `stripe_payment_status_${session.payment_status}`, updated: 0 };
  }

  const result = await markOrdersPaidByNumbers(metadataOrderNumbers, session.id);

  return { ok: true, reason: "stripe_confirmed_paid", updated: result.count };
}

export async function markOrdersPaidByNumbers(orderNumbers: string[], stripeCheckoutSessionId?: string | null) {
  if (orderNumbers.length === 0) {
    return { count: 0 };
  }

  return prisma.order.updateMany({
    where: {
      orderNumber: {
        in: orderNumbers
      }
    },
    data: {
      paymentStatus: PaymentStatus.PAID,
      stripeCheckoutSessionId: stripeCheckoutSessionId ?? undefined
    }
  });
}

export async function markOrdersPaymentFailedBySession(stripeCheckoutSessionId: string) {
  return prisma.order.updateMany({
    where: {
      stripeCheckoutSessionId
    },
    data: {
      paymentStatus: PaymentStatus.FAILED
    }
  });
}
