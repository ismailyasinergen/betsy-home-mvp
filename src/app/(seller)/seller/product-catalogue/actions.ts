"use server";

import { CatalogueStatus, CatalogueTemplate, ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function getBoolean(formData: FormData, key: string, defaultValue = false) {
  if (!formData.has(key)) {
    return defaultValue;
  }

  return formData.get(key) === "on";
}

function getTemplate(value: string) {
  if (value === "LUXURY_LOOKBOOK") return CatalogueTemplate.LUXURY_LOOKBOOK;
  if (value === "WHOLESALE") return CatalogueTemplate.WHOLESALE;
  if (value === "PRICE_LIST") return CatalogueTemplate.PRICE_LIST;
  return CatalogueTemplate.CLEAN_GRID;
}

export async function createSellerCatalogue(formData: FormData) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Run npm run seed first, then try again.");
  }

  const catalogueTitle = getString(formData, "catalogueTitle") || `${shop.shopName} Product Catalogue`;
  const catalogueSubtitle = getOptionalString(formData, "catalogueSubtitle");
  const templateType = getTemplate(getString(formData, "templateType"));
  let selectedProductIds = formData
    .getAll("productIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (selectedProductIds.length === 0) {
    const activeProducts = await prisma.product.findMany({
      where: {
        shopId: shop.id,
        status: ProductStatus.ACTIVE
      },
      select: {
        id: true
      }
    });

    selectedProductIds = activeProducts.map((product) => product.id);
  }

  const catalogue = await prisma.pdfCatalogue.create({
    data: {
      shopId: shop.id,
      catalogueTitle,
      catalogueSubtitle,
      templateType,
      includePrices: getBoolean(formData, "includePrices"),
      includeSku: getBoolean(formData, "includeSku", false),
      includeStock: getBoolean(formData, "includeStock", false),
      includeQrCodes: getBoolean(formData, "includeQrCodes"),
      includeShippingInfo: getBoolean(formData, "includeShippingInfo"),
      selectedProductIds,
      status: CatalogueStatus.READY
    }
  });

  revalidatePath("/seller/product-catalogue");
  redirect(`/seller/product-catalogue/${catalogue.id}`);
}
