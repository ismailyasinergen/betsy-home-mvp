"use server";

import { CustomOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

const allowedStatuses = new Set<string>([
  CustomOrderStatus.OPEN,
  CustomOrderStatus.QUOTED,
  CustomOrderStatus.ACCEPTED,
  CustomOrderStatus.DECLINED,
  CustomOrderStatus.CLOSED
]);

export async function updateCustomRequestStatusAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "").toUpperCase();
  const shop = await getDemoSellerShop();

  if (!shop || !requestId || !allowedStatuses.has(status)) {
    throw new Error("Invalid custom request status update.");
  }

  await prisma.customOrderRequest.updateMany({
    where: {
      id: requestId,
      shopId: (shop as any).id
    },
    data: {
      status: status as CustomOrderStatus
    }
  });

  revalidatePath("/seller/custom-requests");
  revalidatePath(`/seller/custom-requests/${requestId}`);
  revalidatePath("/account/custom-orders");
  revalidatePath(`/account/custom-orders/${requestId}`);
  redirect(`/seller/custom-requests/${requestId}`);
}

export async function replyToCustomRequestAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const markAsQuoted = String(formData.get("markAsQuoted") ?? "") === "on";
  const shop = await getDemoSellerShop();

  if (!shop || !requestId || !message) {
    return;
  }

  const request = await prisma.customOrderRequest.findFirst({
    where: {
      id: requestId,
      shopId: (shop as any).id
    },
    include: {
      buyer: true,
      product: true
    }
  });

  if (!request) {
    return;
  }

  const finalMessage = `Reply to custom request ${request.id.slice(-6).toUpperCase()}${request.product ? ` for ${request.product.title}` : ""}:\n\n${message}`;

  await prisma.message.create({
    data: {
      senderId: (shop as any).sellerId,
      receiverId: request.buyerId,
      shopId: (shop as any).id,
      message: finalMessage
    }
  });

  if (markAsQuoted) {
    await prisma.customOrderRequest.update({
      where: {
        id: request.id
      },
      data: {
        status: CustomOrderStatus.QUOTED
      }
    });
  }

  revalidatePath("/seller/custom-requests");
  revalidatePath(`/seller/custom-requests/${request.id}`);
  revalidatePath("/seller/messages");
  revalidatePath("/account/custom-orders");
  revalidatePath(`/account/custom-orders/${request.id}`);
  revalidatePath("/account/messages");
  redirect(`/seller/custom-requests/${request.id}`);
}
