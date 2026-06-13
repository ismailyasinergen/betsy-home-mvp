"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

function readOptionalNumber(formData: FormData, key: string) {
  const value = readString(formData, key);
  if (!value) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildRequestMessage(input: {
  productTitle?: string | null;
  productSlug?: string | null;
  desiredSize?: string | null;
  desiredColor?: string | null;
  quantity?: number | null;
  budget?: number | null;
  deadline?: string | null;
  shippingCountry?: string | null;
  referenceImageUrl?: string | null;
  message: string;
}) {
  const lines = ["New custom order request"];

  if (input.productTitle) {
    lines.push(`Product: ${input.productTitle}`);
  }

  if (input.productSlug) {
    lines.push(`Product link: /product/${input.productSlug}`);
  }

  if (input.desiredSize) lines.push(`Desired size: ${input.desiredSize}`);
  if (input.desiredColor) lines.push(`Desired color: ${input.desiredColor}`);
  if (input.quantity) lines.push(`Quantity: ${input.quantity}`);
  if (input.budget) lines.push(`Budget: ${input.budget.toFixed(2)} USD/EUR preference to confirm`);
  if (input.deadline) lines.push(`Deadline: ${input.deadline}`);
  if (input.shippingCountry) lines.push(`Shipping country: ${input.shippingCountry}`);
  if (input.referenceImageUrl) lines.push(`Reference image: ${input.referenceImageUrl}`);

  lines.push("");
  lines.push(input.message);

  return lines.join("\n");
}

export async function createCustomOrderRequestAction(formData: FormData) {
  const customer = await getDemoCustomer();
  const shopId = readString(formData, "shopId");
  const productId = readOptionalString(formData, "productId");
  const desiredSize = readOptionalString(formData, "desiredSize");
  const desiredColor = readOptionalString(formData, "desiredColor");
  const quantity = readOptionalNumber(formData, "quantity");
  const budget = readOptionalNumber(formData, "budget");
  const deadlineValue = readOptionalString(formData, "deadline");
  const shippingCountry = readOptionalString(formData, "shippingCountry");
  const referenceImageUrl = readOptionalString(formData, "referenceImageUrl");
  const message = readString(formData, "message");

  if (!shopId || !message) {
    return;
  }

  const shop = await prisma.shop.findUnique({
    where: {
      id: shopId
    }
  });

  if (!shop) {
    return;
  }

  const product = productId
    ? await prisma.product.findUnique({
        where: {
          id: productId
        },
        select: {
          title: true,
          slug: true
        }
      })
    : null;

  const request = await prisma.customOrderRequest.create({
    data: {
      buyerId: customer.id,
      shopId: shop.id,
      productId,
      desiredSize,
      desiredColor,
      quantity,
      budget,
      deadline: deadlineValue ? new Date(`${deadlineValue}T12:00:00`) : null,
      shippingCountry,
      referenceImageUrl,
      message
    }
  });

  await prisma.message.create({
    data: {
      senderId: customer.id,
      receiverId: shop.sellerId,
      shopId: shop.id,
      message: buildRequestMessage({
        productTitle: product?.title,
        productSlug: product?.slug,
        desiredSize,
        desiredColor,
        quantity,
        budget,
        deadline: deadlineValue,
        shippingCountry,
        referenceImageUrl,
        message
      })
    }
  });

  revalidatePath("/account/custom-orders");
  revalidatePath(`/account/custom-orders/${request.id}`);
  revalidatePath("/seller/custom-requests");
  revalidatePath("/seller/messages");
  redirect(`/account/custom-orders/${request.id}`);
}
