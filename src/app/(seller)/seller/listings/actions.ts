"use server";

import { ProductOrigin, ProductStatus, ProductType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";
import { slugify, splitCommaList } from "@/lib/slugify";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const raw = getString(formData, key);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getOptionalNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function createUniqueProductSlug(title: string, currentProductId?: string) {
  const baseSlug = slugify(title) || `product-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });

    if (!existing || existing.id === currentProductId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function revalidateMarketplacePaths(oldSlug?: string | null, newSlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/seller/listings");
  revalidatePath("/seller/shipping");
  if (oldSlug) revalidatePath(`/product/${oldSlug}`);
  if (newSlug) revalidatePath(`/product/${newSlug}`);
}

export async function createSellerListing(formData: FormData) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Create a shop first, then try again.");
  }

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const price = getNumber(formData, "price");
  const salePrice = getOptionalNumber(formData, "salePrice");
  const quantity = Math.max(0, Math.floor(getNumber(formData, "quantity")));
  const categoryId = getString(formData, "categoryId");
  const roomId = getOptionalString(formData, "roomId");
  const styleId = getOptionalString(formData, "styleId");
  const shippingProfileId = getOptionalString(formData, "shippingProfileId");
  const imageUrl = getOptionalString(formData, "imageUrl");
  const sku = getOptionalString(formData, "sku");
  const dimensions = getOptionalString(formData, "dimensions");
  const careInstructions = getOptionalString(formData, "careInstructions");
  const personalizationHint = getOptionalString(formData, "personalizationHint");
  const isCustomizable = formData.get("isCustomizable") === "on";
  const publishIntent = getString(formData, "intent") === "publish";

  if (!title || !description || !categoryId || price <= 0) {
    throw new Error("Title, description, category, and a price greater than 0 are required.");
  }

  const slug = await createUniqueProductSlug(title);
  const materials = splitCommaList(formData.get("materials"));
  const bestFor = splitCommaList(formData.get("bestFor"));
  const tags = splitCommaList(formData.get("tags"));
  const searchKeywords = Array.from(new Set([title, ...tags, ...materials, ...bestFor, "handmade home", "betsy home"]));

  await prisma.product.create({
    data: {
      shopId: (shop as any).id,
      title,
      slug,
      description,
      price,
      salePrice: salePrice && salePrice > 0 ? salePrice : null,
      quantity,
      sku,
      categoryId,
      roomId,
      styleId,
      shippingProfileId,
      status: publishIntent ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
      productType: ProductType.PHYSICAL,
      origin: ProductOrigin.HANDMADE,
      isCustomizable,
      personalizationHint,
      materials,
      dimensions,
      careInstructions,
      bestFor,
      tags,
      searchKeywords,
      images: imageUrl
        ? {
            create: [
              {
                imageUrl,
                altText: title,
                sortOrder: 0
              }
            ]
          }
        : undefined
    }
  });

  revalidateMarketplacePaths(null, slug);
  redirect("/seller/listings");
}

export async function updateSellerListing(productId: string, formData: FormData) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found.");
  }

  const existingProduct = await prisma.product.findFirst({
    where: {
      id: productId,
      shopId: (shop as any).id
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc"
        }
      }
    }
  });

  if (!existingProduct) {
    throw new Error("Product could not be found for this seller shop.");
  }

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const price = getNumber(formData, "price");
  const salePrice = getOptionalNumber(formData, "salePrice");
  const quantity = Math.max(0, Math.floor(getNumber(formData, "quantity")));
  const categoryId = getString(formData, "categoryId");
  const roomId = getOptionalString(formData, "roomId");
  const styleId = getOptionalString(formData, "styleId");
  const shippingProfileId = getOptionalString(formData, "shippingProfileId");
  const imageUrl = getOptionalString(formData, "imageUrl");
  const sku = getOptionalString(formData, "sku");
  const dimensions = getOptionalString(formData, "dimensions");
  const careInstructions = getOptionalString(formData, "careInstructions");
  const personalizationHint = getOptionalString(formData, "personalizationHint");
  const isCustomizable = formData.get("isCustomizable") === "on";
  const status = getString(formData, "status") as ProductStatus;

  if (!title || !description || !categoryId || price <= 0) {
    throw new Error("Title, description, category, and a price greater than 0 are required.");
  }

  if (!Object.values(ProductStatus).includes(status)) {
    throw new Error("Invalid product status.");
  }

  const slug = await createUniqueProductSlug(title, productId);
  const materials = splitCommaList(formData.get("materials"));
  const bestFor = splitCommaList(formData.get("bestFor"));
  const tags = splitCommaList(formData.get("tags"));
  const searchKeywords = Array.from(new Set([title, ...tags, ...materials, ...bestFor, "handmade home", "betsy home"]));

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      title,
      slug,
      description,
      price,
      salePrice: salePrice && salePrice > 0 ? salePrice : null,
      quantity,
      sku,
      categoryId,
      roomId,
      styleId,
      shippingProfileId,
      status,
      isCustomizable,
      personalizationHint,
      materials,
      dimensions,
      careInstructions,
      bestFor,
      tags,
      searchKeywords
    }
  });

  if (imageUrl) {
    const existingImage = existingProduct.images[0];

    if (existingImage) {
      await prisma.productImage.update({
        where: {
          id: existingImage.id
        },
        data: {
          imageUrl,
          altText: title
        }
      });
    } else {
      await prisma.productImage.create({
        data: {
          productId,
          imageUrl,
          altText: title,
          sortOrder: 0
        }
      });
    }
  }

  revalidateMarketplacePaths(existingProduct.slug, slug);
  redirect("/seller/listings");
}

export async function changeSellerListingStatus(productId: string, status: ProductStatus) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found.");
  }

  if (!Object.values(ProductStatus).includes(status)) {
    throw new Error("Invalid product status.");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shopId: (shop as any).id
    }
  });

  if (!product) {
    throw new Error("Product could not be found for this seller shop.");
  }

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      status
    }
  });

  revalidateMarketplacePaths(product.slug, product.slug);
}

export async function deleteSellerListing(productId: string) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found.");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shopId: (shop as any).id
    }
  });

  if (!product) {
    throw new Error("Product could not be found for this seller shop.");
  }

  await prisma.product.delete({
    where: {
      id: productId
    }
  });

  revalidateMarketplacePaths(product.slug, null);
  redirect("/seller/listings");
}
