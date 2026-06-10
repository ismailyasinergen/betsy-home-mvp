"use server";

import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

function requireString(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

export async function submitProductReviewAction(formData: FormData) {
  const customer = await getDemoCustomer();
  const orderId = requireString(formData.get("orderId"), "Order");
  const productId = requireString(formData.get("productId"), "Product");
  const ratingValue = Number(formData.get("rating"));
  const comment = typeof formData.get("comment") === "string" ? String(formData.get("comment")).trim() : "";

  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      paymentStatus: PaymentStatus.PAID,
      OR: [
        { buyerId: customer.id },
        { buyerId: null }
      ],
      items: {
        some: {
          productId
        }
      }
    },
    include: {
      shop: true
    }
  });

  if (!order) {
    throw new Error("This product is not reviewable from this customer account.");
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    select: {
      shopId: true,
      slug: true
    }
  });

  if (!product || product.shopId !== order.shopId) {
    throw new Error("Product does not belong to this order.");
  }

  await prisma.review.upsert({
    where: {
      orderId_productId_buyerId: {
        orderId,
        productId,
        buyerId: customer.id
      }
    },
    update: {
      rating: ratingValue,
      comment: comment || null
    },
    create: {
      orderId,
      productId,
      buyerId: customer.id,
      shopId: order.shopId,
      rating: ratingValue,
      comment: comment || null
    }
  });

  const shopReviews = await prisma.review.findMany({
    where: {
      shopId: order.shopId
    },
    select: {
      rating: true
    }
  });

  if (shopReviews.length > 0) {
    const averageRating = shopReviews.reduce((sum, review) => sum + review.rating, 0) / shopReviews.length;
    await prisma.shop.update({
      where: {
        id: order.shopId
      },
      data: {
        rating: Number(averageRating.toFixed(1))
      }
    });
  }

  revalidatePath("/account/reviews");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/seller/reviews");
  revalidatePath(`/product/${product.slug}`);
  redirect("/account/reviews?reviewed=1");
}
