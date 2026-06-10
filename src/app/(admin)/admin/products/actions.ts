"use server";

import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function updateProductStatus(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const status = String(formData.get("status") ?? "") as ProductStatus;

  if (!productId || !Object.values(ProductStatus).includes(status)) {
    throw new Error("Invalid product status update.");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/dashboard");
  revalidatePath("/search");
}
