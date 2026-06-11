"use server";

import { PaymentStatus, RefundRequestStatus, ShippingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function note(value: FormDataEntryValue | null, fallback: string) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function revalidateRefundPaths(orderId: string) {
  revalidatePath("/admin/refunds");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function approveAdminRefundRequestAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, refundRequestStatus: true }
  });

  if (!order) {
    throw new Error("Order could not be found.");
  }

  if (order.refundRequestStatus !== RefundRequestStatus.REQUESTED) {
    throw new Error("Only requested refunds can be approved from this admin action.");
  }

  const resolutionNote = note(
    formData.get("refundResolutionNote"),
    "Refund/cancellation approved by admin. Confirm Stripe refund manually if needed."
  );

  const shouldMarkRefunded = ([PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED] as PaymentStatus[]).includes(order.paymentStatus);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: shouldMarkRefunded ? PaymentStatus.REFUNDED : order.paymentStatus,
      shippingStatus: ShippingStatus.CANCELLED,
      refundRequestStatus: RefundRequestStatus.APPROVED,
      refundResolvedAt: new Date(),
      refundResolutionNote: resolutionNote
    }
  });

  revalidateRefundPaths(order.id);
}

export async function rejectAdminRefundRequestAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  const resolutionNote = note(
    formData.get("refundResolutionNote"),
    "Refund/cancellation request rejected by admin after review."
  );

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      refundRequestStatus: RefundRequestStatus.REQUESTED
    },
    data: {
      refundRequestStatus: RefundRequestStatus.REJECTED,
      refundResolvedAt: new Date(),
      refundResolutionNote: resolutionNote
    }
  });

  if (result.count === 0) {
    throw new Error("Requested refund could not be found.");
  }

  revalidateRefundPaths(orderId);
}

export async function markManualRefundResolvedAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  const manualReference = note(formData.get("manualRefundReference"), `manual-admin-confirmed-${Date.now()}`);
  const adminNote = note(formData.get("adminNote"), "Manual Stripe/refund follow-up confirmed by admin.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, refundResolutionNote: true }
  });

  if (!order) {
    throw new Error("Order could not be found.");
  }

  const nextNote = order.refundResolutionNote
    ? `${order.refundResolutionNote} Admin follow-up: ${adminNote}`
    : `Admin follow-up: ${adminNote}`;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: PaymentStatus.REFUNDED,
      shippingStatus: ShippingStatus.CANCELLED,
      refundRequestStatus: RefundRequestStatus.APPROVED,
      refundResolvedAt: new Date(),
      refundStripeRefundId: manualReference,
      refundResolutionNote: nextNote
    }
  });

  revalidateRefundPaths(order.id);
}
