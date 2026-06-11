"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

function requireString(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

export async function replyToReviewAction(formData: FormData) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop found.");
  }

  const reviewId = requireString(formData.get("reviewId"), "Review");
  const sellerResponse = requireString(formData.get("sellerResponse"), "Response");

  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      shopId: (shop as any).id
    },
    include: {
      product: true
    }
  });

  if (!review) {
    throw new Error("Review not found for this seller.");
  }

  await prisma.review.update({
    where: {
      id: review.id
    },
    data: {
      sellerResponse
    }
  });

  revalidatePath("/seller/reviews");
  revalidatePath(`/product/${review.product.slug}`);
  redirect("/seller/reviews?replied=1");
}
