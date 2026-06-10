import { PaymentStatus, RefundRequestStatus, ShippingStatus } from "@prisma/client";
import { requireCurrentCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const orderInclude = {
  shop: true,
  reviews: true,
  items: {
    include: {
      product: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc" as const
            },
            take: 1
          }
        }
      }
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
};

function cleanOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text.slice(0, 500) : null;
}

export async function getCustomerOrders() {
  const customer = await requireCurrentCustomer("/account/orders");

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { buyerId: customer.id },
        // Keep older demo orders visible. New orders are attached to the signed-in customer.
        { buyerId: null }
      ]
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    customer,
    orders
  };
}

export async function getCustomerOrderById(orderId: string) {
  const customer = await requireCurrentCustomer("/account/orders");

  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { buyerId: customer.id },
        // Older demo orders were created before every order was attached to a buyer.
        { buyerId: null }
      ]
    },
    include: orderInclude
  });
}

export async function confirmCustomerOrderDelivery(orderId: string, noteValue: unknown) {
  const customer = await requireCurrentCustomer(`/account/orders/${orderId}`);

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { buyerId: customer.id },
        { buyerId: null }
      ]
    },
    select: {
      id: true,
      paymentStatus: true,
      shippingStatus: true,
      buyerConfirmedAt: true
    }
  });

  if (!order) {
    throw new Error("Order could not be found.");
  }

  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw new Error("Only paid orders can be confirmed as received.");
  }

  if (order.shippingStatus !== ShippingStatus.DELIVERED) {
    throw new Error("Only delivered orders can be confirmed as received.");
  }

  if (order.buyerConfirmedAt) {
    return order;
  }

  return prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      buyerConfirmedAt: new Date(),
      buyerDeliveryNote: cleanOptionalText(noteValue)
    }
  });
}


export async function requestCustomerOrderCancellation(orderId: string, reasonValue: unknown) {
  const customer = await requireCurrentCustomer(`/account/orders/${orderId}`);

  const reason = cleanOptionalText(reasonValue);

  if (!reason) {
    throw new Error("Please add a short reason for the cancellation/refund request.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { buyerId: customer.id },
        { buyerId: null }
      ]
    },
    select: {
      id: true,
      paymentStatus: true,
      shippingStatus: true,
      buyerConfirmedAt: true,
      refundRequestStatus: true
    }
  });

  if (!order) {
    throw new Error("Order could not be found.");
  }

  if (order.paymentStatus === PaymentStatus.REFUNDED) {
    throw new Error("This order has already been refunded.");
  }

  if (order.shippingStatus === ShippingStatus.CANCELLED) {
    throw new Error("This order is already cancelled.");
  }

  if (order.buyerConfirmedAt) {
    throw new Error("Delivery was already confirmed. Contact support for a dispute instead.");
  }

  if (order.refundRequestStatus === RefundRequestStatus.REQUESTED) {
    return order;
  }

  return prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      refundRequestStatus: RefundRequestStatus.REQUESTED,
      refundRequestedAt: new Date(),
      refundReason: reason,
      refundResolutionNote: null,
      refundResolvedAt: null,
      refundStripeRefundId: null
    }
  });
}
