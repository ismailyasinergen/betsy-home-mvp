"use server";

import { revalidatePath } from "next/cache";
import { ShopStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function updateShopStatus(formData: FormData) {
  const shopId = String(formData.get("shopId") ?? "");
  const status = String(formData.get("status") ?? "") as ShopStatus;

  if (!shopId || !Object.values(ShopStatus).includes(status)) {
    throw new Error("Invalid shop status update.");
  }

  await prisma.shop.update({
    where: { id: shopId },
    data: { status }
  });

  revalidatePath("/admin/sellers");
  revalidatePath("/admin/dashboard");
}
