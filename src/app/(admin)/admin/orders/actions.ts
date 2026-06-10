"use server";

import { revalidatePath } from "next/cache";
import { PaymentStatus, ShippingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function updateAdminOrderStatus(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "") as PaymentStatus;
  const shippingStatus = String(formData.get("shippingStatus") ?? "") as ShippingStatus;

  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  const data: { paymentStatus?: PaymentStatus; shippingStatus?: ShippingStatus } = {};

  if (Object.values(PaymentStatus).includes(paymentStatus)) {
    data.paymentStatus = paymentStatus;
  }

  if (Object.values(ShippingStatus).includes(shippingStatus)) {
    data.shippingStatus = shippingStatus;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Choose at least one valid status.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  revalidatePath("/seller/orders");
}
