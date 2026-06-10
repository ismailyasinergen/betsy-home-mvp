import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { markOrdersPaidByNumbers, markOrdersPaymentFailedBySession } from "@/lib/stripe-connect";

function getOrderNumbersFromMetadata(metadata?: Stripe.Metadata | null) {
  return String(metadata?.orderNumbers ?? "")
    .split(",")
    .map((orderNumber) => orderNumber.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumbers = getOrderNumbersFromMetadata(session.metadata);
        await markOrdersPaidByNumbers(orderNumbers, session.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const checkoutSession = await prisma.order.findFirst({
          where: {
            stripePaymentIntentId: paymentIntent.id
          },
          select: {
            stripeCheckoutSessionId: true
          }
        });

        if (checkoutSession?.stripeCheckoutSessionId) {
          await markOrdersPaymentFailedBySession(checkoutSession.stripeCheckoutSessionId);
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await prisma.shop.updateMany({
          where: {
            stripeAccountId: account.id
          },
          data: {
            updatedAt: new Date()
          }
        });
        break;
      }
      case "charge.refunded":
      case "payout.paid":
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }
}
