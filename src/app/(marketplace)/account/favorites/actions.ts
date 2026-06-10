"use server";

import { revalidatePath } from "next/cache";
import { saveProductToFavorites, removeProductFromFavorites, toggleProductFavorite } from "@/lib/favorites";

function revalidateFavoritePages() {
  revalidatePath("/", "layout");
  revalidatePath("/search");
  revalidatePath("/account");
  revalidatePath("/account/favorites");
  revalidatePath("/product/[slug]", "page");
}

function getProductIdentifiers(formData: FormData) {
  return {
    productId: String(formData.get("productId") ?? "").trim(),
    productSlug: String(formData.get("productSlug") ?? "").trim()
  };
}

export async function saveProductToFavoritesAction(formData: FormData) {
  const { productId, productSlug } = getProductIdentifiers(formData);

  if (!productId && !productSlug) {
    return;
  }

  await saveProductToFavorites(productId || productSlug, productSlug);
  revalidateFavoritePages();
}

export async function removeProductFromFavoritesAction(formData: FormData) {
  const { productId, productSlug } = getProductIdentifiers(formData);

  if (!productId && !productSlug) {
    return;
  }

  await removeProductFromFavorites(productId || productSlug, productSlug);
  revalidateFavoritePages();
}

export async function toggleProductFavoriteAction(formData: FormData) {
  const { productId, productSlug } = getProductIdentifiers(formData);

  if (!productId && !productSlug) {
    return;
  }

  await toggleProductFavorite(productId || productSlug, productSlug);
  revalidateFavoritePages();
}
