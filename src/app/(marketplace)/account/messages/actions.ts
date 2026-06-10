"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

function readMessage(formData: FormData) {
  return String(formData.get("message") ?? "").trim();
}

export async function sendMessageToSellerAction(formData: FormData) {
  const customer = await getDemoCustomer();
  const shopId = String(formData.get("shopId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const message = readMessage(formData);

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

  let finalMessage = message;

  if (productId) {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        title: true,
        slug: true
      }
    });

    if (product) {
      finalMessage = `Question about ${product.title}:\n\n${message}\n\nProduct link: /product/${product.slug}`;
    }
  }

  await prisma.message.create({
    data: {
      senderId: customer.id,
      receiverId: shop.sellerId,
      shopId: shop.id,
      message: finalMessage
    }
  });

  revalidatePath("/account/messages");
  revalidatePath(`/account/messages/${shop.id}`);
  revalidatePath("/seller/messages");
  redirect(`/account/messages/${shop.id}`);
}

export async function customerReplyMessageAction(formData: FormData) {
  const customer = await getDemoCustomer();
  const shopId = String(formData.get("shopId") ?? "");
  const message = readMessage(formData);

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

  await prisma.message.create({
    data: {
      senderId: customer.id,
      receiverId: shop.sellerId,
      shopId: shop.id,
      message
    }
  });

  revalidatePath("/account/messages");
  revalidatePath(`/account/messages/${shop.id}`);
  revalidatePath("/seller/messages");
  redirect(`/account/messages/${shop.id}`);
}
