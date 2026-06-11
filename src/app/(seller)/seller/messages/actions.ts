"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

export async function sellerReplyMessageAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const shop = await getDemoSellerShop();

  if (!shop || !customerId || !message) {
    return;
  }

  const customer = await prisma.user.findUnique({
    where: {
      id: customerId
    }
  });

  if (!customer) {
    return;
  }

  await prisma.message.create({
    data: {
      senderId: (shop as any).sellerId,
      receiverId: (customer as any).id,
      shopId: (shop as any).id,
      message
    }
  });

  revalidatePath("/seller/messages");
  revalidatePath(`/seller/messages/${(customer as any).id}`);
  revalidatePath("/account/messages");
  redirect(`/seller/messages/${(customer as any).id}`);
}
