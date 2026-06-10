"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { confirmCustomerOrderDelivery, requestCustomerOrderCancellation } from "@/lib/customer-orders";

export async function confirmDeliveryAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  await confirmCustomerOrderDelivery(orderId, formData.get("buyerDeliveryNote"));

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  redirect(`/account/orders/${orderId}?confirmed=1`);
}

export async function requestCancellationAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  await requestCustomerOrderCancellation(orderId, formData.get("refundReason"));

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  redirect(`/account/orders/${orderId}?refund=requested`);
}
