"use server";

import { ShippingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveSellerRefundRequest, rejectSellerRefundRequest, updateSellerOrderShippingStatus, updateSellerOrderTracking } from "@/lib/orders";

const allowedStatuses = new Set<string>([
  ShippingStatus.NEW,
  ShippingStatus.PROCESSING,
  ShippingStatus.SHIPPED,
  ShippingStatus.DELIVERED,
  ShippingStatus.CANCELLED
]);

export async function updateOrderShippingStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const rawStatus = String(formData.get("shippingStatus") ?? "").toUpperCase();

  if (!orderId || !allowedStatuses.has(rawStatus)) {
    throw new Error("Invalid order status update.");
  }

  await updateSellerOrderShippingStatus(orderId, rawStatus as ShippingStatus);

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  redirect(`/seller/orders/${orderId}`);
}

export async function updateOrderTrackingAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  await updateSellerOrderTracking(orderId, {
    trackingCarrier: formData.get("trackingCarrier"),
    trackingNumber: formData.get("trackingNumber"),
    trackingUrl: formData.get("trackingUrl"),
    shippingNote: formData.get("shippingNote"),
    markAsShipped: formData.get("markAsShipped") === "on"
  });

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  redirect(`/seller/orders/${orderId}`);
}


export async function approveRefundRequestAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  await approveSellerRefundRequest(orderId, formData.get("refundResolutionNote"));

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath("/seller/payments");
  redirect(`/seller/orders/${orderId}?refund=approved`);
}

export async function rejectRefundRequestAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  await rejectSellerRefundRequest(orderId, formData.get("refundResolutionNote"));

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  redirect(`/seller/orders/${orderId}?refund=rejected`);
}
