"use server";

import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export async function createCollection(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!title) {
    throw new Error("Collection title is required.");
  }

  const slug = slugify(title);

  await prisma.collection.upsert({
    where: { slug },
    update: {
      title,
      description: description || null,
      imageUrl: imageUrl || null
    },
    create: {
      title,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      status: ProductStatus.ACTIVE
    }
  });

  revalidatePath("/admin/collections");
}

export async function updateCollectionStatus(formData: FormData) {
  const collectionId = String(formData.get("collectionId") ?? "");
  const status = String(formData.get("status") ?? "") as ProductStatus;

  if (!collectionId || !Object.values(ProductStatus).includes(status)) {
    throw new Error("Invalid collection status update.");
  }

  await prisma.collection.update({ where: { id: collectionId }, data: { status } });
  revalidatePath("/admin/collections");
}

export async function addProductToCollection(formData: FormData) {
  const collectionId = String(formData.get("collectionId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (!collectionId || !productId) {
    throw new Error("Collection and product are required.");
  }

  const count = await prisma.collectionProduct.count({ where: { collectionId } });

  await prisma.collectionProduct.upsert({
    where: { collectionId_productId: { collectionId, productId } },
    update: {},
    create: { collectionId, productId, sortOrder: count }
  });

  revalidatePath("/admin/collections");
}

export async function removeProductFromCollection(formData: FormData) {
  const collectionProductId = String(formData.get("collectionProductId") ?? "");

  if (!collectionProductId) {
    throw new Error("Missing collection item ID.");
  }

  await prisma.collectionProduct.delete({ where: { id: collectionProductId } });
  revalidatePath("/admin/collections");
}
