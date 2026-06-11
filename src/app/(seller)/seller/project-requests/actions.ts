"use server";

import { BusinessProjectStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalNumber(value: string) {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function submitBusinessProjectQuote(projectRequestId: string, formData: FormData) {
  const user = await requireRole([UserRole.SELLER], "/seller/project-requests");

  const totalPrice = optionalNumber(text(formData, "totalPrice"));
  const shippingPrice = optionalNumber(text(formData, "shippingPrice"));
  const productionDays = optionalNumber(text(formData, "productionDays"));
  const message = text(formData, "message");

  if (!totalPrice || totalPrice <= 0 || !message) {
    throw new Error("Total price and message are required.");
  }

  const shop = await prisma.shop.findFirst({
    where: {
      sellerId: user.id
    }
  });

  await prisma.businessProjectQuote.create({
    data: {
      projectRequestId,
      sellerId: user.id,
      shopId: (shop as any)?.id ?? null,
      shopName: (shop as any)?.shopName ?? user.name ?? user.email,
      totalPrice,
      shippingPrice,
      productionDays: productionDays ? Math.round(productionDays) : null,
      message
    }
  });

  await prisma.businessProjectRequest.update({
    where: {
      id: projectRequestId
    },
    data: {
      status: BusinessProjectStatus.QUOTED
    }
  });

  revalidatePath("/seller/project-requests");
  revalidatePath("/account/projects");
  revalidatePath("/admin/project-requests");
}
