import { PaymentStatus, RefundRequestStatus, ShippingStatus } from "@prisma/client";
import { clearCurrentCart, getCartPageData } from "@/lib/cart";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";
import {
  notifyManualRefundFollowup,
  notifyOrderCreated,
  notifyRefundResolved,
  notifyShippingUpdated,
} from "@/lib/notification-events";

type ShippingAddressInput = {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
};

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function makeOrderNumber(index: number) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BH-${y}${m}${d}-${random}-${index + 1}`;
}

async function notifySafely(label: string, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    console.warn(`[notifications] ${label} failed`, error);
  }
}

export function getShippingAddressFromForm(formData: FormData, countryCode: string, countryName: string): ShippingAddressInput {
  return {
    fullName: cleanText(formData.get("fullName"), "Demo Customer"),
    line1: cleanText(formData.get("line1"), "Demo address 12"),
    city: cleanText(formData.get("city"), "Berlin"),
    postalCode: cleanText(formData.get("postalCode"), "10115"),
    countryCode,
    countryName
  };
}

export async function createPendingOrdersFromCart(countryCode: string, shippingAddress: ShippingAddressInput) {
  const cart = await getCartPageData(countryCode);

  if (cart.items.length === 0) {
    return {
      ok: false,
      reason: "empty_cart",
      selectedCountryCode: cart.selectedCountryCode,
      orderNumbers: [] as string[]
    };
  }

  if (!cart.canCheckout) {
    return {
      ok: false,
      reason: "blocked_shipping",
      selectedCountryCode: cart.selectedCountryCode,
      orderNumbers: [] as string[]
    };
  }

  const groups = cart.groups;
  const customer = await getDemoCustomer();

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders = [];

    for (const [index, group] of groups.entries()) {
      const platformFee = Number((group.subtotal * 0.1).toFixed(2));
      const order = await tx.order.create({
        data: {
          buyerId: customer.id,
          shopId: group.shopId,
          orderNumber: makeOrderNumber(index),
          subtotal: group.subtotal,
          shippingTotal: 0,
          taxTotal: 0,
          platformFee,
          total: group.subtotal,
          paymentStatus: PaymentStatus.PENDING,
          shippingStatus: ShippingStatus.NEW,
          shippingAddress,
          items: {
            create: group.items.map((item) => ({
              productId: item.product.id,
              titleSnapshot: item.product.title,
              priceSnapshot: item.price,
              quantity: item.quantity,
              personalizationText: item.personalizationText
            }))
          }
        },
        include: {
          items: true,
          shop: true
        }
      });

      for (const item of group.items) {
        await tx.product.update({
          where: {
            id: item.product.id
          },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      orders.push(order);
    }

    return orders;
  });

  await clearCurrentCart();

  await Promise.allSettled(
    createdOrders.map((order) => notifyOrderCreated(order.id))
  );

  return {
    ok: true,
    reason: "created",
    selectedCountryCode: cart.selectedCountryCode,
    orderNumbers: createdOrders.map((order) => order.orderNumber)
  };
}

export async function getOrdersByNumbers(orderNumbers: string[]) {
  if (orderNumbers.length === 0) {
    return [];
  }

  return prisma.order.findMany({
    where: {
      orderNumber: {
        in: orderNumbers
      }
    },
    include: {
      shop: true,
      items: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getSellerOrders() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      orders: []
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      shopId: shop.id
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    shop,
    orders
  };
}


export async function getSellerOrderById(orderId: string) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      order: null
    };
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      shopId: shop.id
    },
    include: {
      shop: true,
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: {
                  sortOrder: "asc"
                },
                take: 1
              }
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  return {
    shop,
    order
  };
}

export async function updateSellerOrderShippingStatus(orderId: string, shippingStatus: ShippingStatus) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Run npm run seed first, then try again.");
  }

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      shopId: shop.id
    },
    data: {
      shippingStatus
    }
  });

  if (result.count === 0) {
    throw new Error("Order could not be found for this seller.");
  }

  await notifySafely("shipping status update", () => notifyShippingUpdated(orderId));
}

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export type SellerOrderTrackingInput = {
  trackingCarrier?: unknown;
  trackingNumber?: unknown;
  trackingUrl?: unknown;
  shippingNote?: unknown;
  markAsShipped?: boolean;
};

export async function updateSellerOrderTracking(orderId: string, input: SellerOrderTrackingInput) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Run npm run seed first, then try again.");
  }

  const trackingCarrier = optionalText(input.trackingCarrier);
  const trackingNumber = optionalText(input.trackingNumber);
  const trackingUrl = optionalText(input.trackingUrl);
  const shippingNote = optionalText(input.shippingNote);

  const shouldMarkAsShipped = Boolean(input.markAsShipped && (trackingCarrier || trackingNumber || trackingUrl));

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      shopId: shop.id
    },
    data: {
      trackingCarrier,
      trackingNumber,
      trackingUrl,
      shippingNote,
      ...(shouldMarkAsShipped ? { shippingStatus: ShippingStatus.SHIPPED } : {})
    }
  });

  if (result.count === 0) {
    throw new Error("Order could not be found for this seller.");
  }

  await notifySafely("tracking update", () => notifyShippingUpdated(orderId));
}

export async function approveSellerRefundRequest(orderId: string, noteValue: unknown) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Run npm run seed first, then try again.");
  }

  const note = optionalText(noteValue) ?? "Refund/cancellation approved by seller.";

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      shopId: shop.id
    },
    select: {
      id: true,
      shopId: true,
      orderNumber: true,
      paymentStatus: true,
      refundRequestStatus: true,
      stripeCheckoutSessionId: true
    }
  });

  if (!order) {
    throw new Error("Order could not be found for this seller.");
  }

  if (order.refundRequestStatus !== RefundRequestStatus.REQUESTED) {
    throw new Error("Only requested refunds/cancellations can be approved.");
  }

  let stripeRefundId: string | null = null;
  let finalNote = note;

  try {
    const { stripe } = await import("@/lib/stripe");

    if (stripe && order.paymentStatus === PaymentStatus.PAID && order.stripeCheckoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      if (paymentIntentId) {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          refund_application_fee: true,
          reverse_transfer: true,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            shopId: order.shopId,
            source: "betsy_home_seller_approval"
          }
        } as any);

        stripeRefundId = refund.id;
        finalNote = `${note} Stripe refund created: ${refund.id}`;
      } else {
        finalNote = `${note} Stripe payment intent was not available, so this was recorded as a manual refund approval.`;
      }
    } else if (order.paymentStatus === PaymentStatus.PAID) {
      finalNote = `${note} Stripe was not configured locally or no checkout session was stored, so this was recorded as a manual refund approval.`;
    }
  } catch (error) {
    finalNote = `${note} Stripe refund attempt failed locally, so this was recorded for manual follow-up.`;
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus,
      shippingStatus: ShippingStatus.CANCELLED,
      refundRequestStatus: RefundRequestStatus.APPROVED,
      refundResolvedAt: new Date(),
      refundResolutionNote: finalNote,
      refundStripeRefundId: stripeRefundId
    }
  });

  await notifySafely("refund approved", () => notifyRefundResolved(updatedOrder.id));

  if (order.paymentStatus === PaymentStatus.PAID && !stripeRefundId) {
    await notifySafely("manual refund follow-up", () => notifyManualRefundFollowup(updatedOrder.id));
  }

  return updatedOrder;
}

export async function rejectSellerRefundRequest(orderId: string, noteValue: unknown) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Run npm run seed first, then try again.");
  }

  const note = optionalText(noteValue) ?? "Refund/cancellation request rejected by seller.";

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      shopId: shop.id,
      refundRequestStatus: RefundRequestStatus.REQUESTED
    },
    data: {
      refundRequestStatus: RefundRequestStatus.REJECTED,
      refundResolvedAt: new Date(),
      refundResolutionNote: note
    }
  });

  if (result.count === 0) {
    throw new Error("Refund request could not be found for this seller.");
  }

  await notifySafely("refund rejected", () => notifyRefundResolved(orderId));
}
