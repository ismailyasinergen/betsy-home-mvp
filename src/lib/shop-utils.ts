import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export async function createUniqueShopSlug(shopName: string) {
  const baseSlug = slugify(shopName) || "betsy-home-shop";
  let slug = baseSlug;
  let index = 1;

  while (await prisma.shop.findUnique({ where: { shopSlug: slug } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return slug;
}

export function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export function optionalText(value: FormDataEntryValue | null) {
  const cleaned = cleanText(value);
  return cleaned.length > 0 ? cleaned : null;
}
