"use server";

import { ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function getInventoryQuantity(formData: FormData) {
  const raw = getString(formData, "quantity");
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

async function getSellerProduct(productId: string) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found.");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shopId: shop.id
    }
  });

  if (!product) {
    throw new Error("Product could not be found for this seller shop.");
  }

  return { shop, product };
}

function revalidateInventory(productSlug?: string | null) {
  revalidatePath("/seller/dashboard");
  revalidatePath("/seller/listings");
  revalidatePath("/seller/inventory");
  revalidatePath("/seller/shipping");
  revalidatePath("/search");
  if (productSlug) {
    revalidatePath(`/product/${productSlug}`);
  }
}

export async function updateInventoryQuantity(productId: string, formData: FormData) {
  const { product } = await getSellerProduct(productId);
  const quantity = getInventoryQuantity(formData);
  const nextStatus = quantity <= 0 ? ProductStatus.SOLD_OUT : product.status === ProductStatus.SOLD_OUT ? ProductStatus.ACTIVE : product.status;

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      quantity,
      status: nextStatus
    }
  });

  revalidateInventory(product.slug);
}

export async function markInventorySoldOut(productId: string) {
  const { product } = await getSellerProduct(productId);

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      quantity: 0,
      status: ProductStatus.SOLD_OUT
    }
  });

  revalidateInventory(product.slug);
}

export async function publishInventoryProduct(productId: string) {
  const { product } = await getSellerProduct(productId);

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      status: product.quantity <= 0 ? ProductStatus.SOLD_OUT : ProductStatus.ACTIVE
    }
  });

  revalidateInventory(product.slug);
}

export async function markInventoryNeedsReview(productId: string) {
  const { product } = await getSellerProduct(productId);

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      status: ProductStatus.NEEDS_REVIEW
    }
  });

  revalidateInventory(product.slug);
}

export async function assignInventoryShippingProfile(productId: string, formData: FormData) {
  const { shop, product } = await getSellerProduct(productId);
  const shippingProfileId = getOptionalString(formData, "shippingProfileId");

  if (shippingProfileId) {
    const profile = await prisma.shippingProfile.findFirst({
      where: {
        id: shippingProfileId,
        shopId: shop.id
      }
    });

    if (!profile) {
      throw new Error("Shipping profile could not be found for this seller shop.");
    }
  }

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      shippingProfileId
    }
  });

  revalidateInventory(product.slug);
}
