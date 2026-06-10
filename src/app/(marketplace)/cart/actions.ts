"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addProductToCart, removeCartItem, updateCartItemQuantity } from "@/lib/cart";

export async function addProductToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const personalizationText = String(formData.get("personalizationText") ?? "");

  if (!productId) {
    throw new Error("Missing product ID.");
  }

  await addProductToCart(productId, personalizationText);
  revalidatePath("/cart");
  redirect("/cart");
}

export async function updateCartItemQuantityAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const country = String(formData.get("country") ?? "DE");

  if (itemId) {
    await updateCartItemQuantity(itemId, quantity);
  }

  revalidatePath("/cart");
  redirect(`/cart?country=${country}`);
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const country = String(formData.get("country") ?? "DE");

  if (itemId) {
    await removeCartItem(itemId);
  }

  revalidatePath("/cart");
  redirect(`/cart?country=${country}`);
}
