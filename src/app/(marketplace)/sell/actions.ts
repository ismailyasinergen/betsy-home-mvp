"use server";

import { redirect } from "next/navigation";
import { ShopStatus, UserRole } from "@prisma/client";
import { requireSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText, createUniqueShopSlug, optionalText } from "@/lib/shop-utils";

export async function createSellerShop(formData: FormData) {
  const user = await requireSignedIn("/sell");

  if (user.role === UserRole.ADMIN) {
    redirect("/admin/dashboard");
  }

  const existingShop = await prisma.shop.findFirst({
    where: {
      sellerId: user.id
    }
  });

  if (existingShop) {
    if (user.role !== UserRole.SELLER) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.SELLER }
      });
    }

    redirect("/seller/settings?already=1");
  }

  const shopName = cleanText(formData.get("shopName"));
  const description = optionalText(formData.get("description"));
  const location = optionalText(formData.get("location"));
  const countryCode = optionalText(formData.get("countryCode"))?.toUpperCase() ?? null;
  const logoUrl = optionalText(formData.get("logoUrl"));
  const bannerUrl = optionalText(formData.get("bannerUrl"));

  if (!shopName || shopName.length < 3) {
    redirect("/sell?error=shop-name");
  }

  const shopSlug = await createUniqueShopSlug(shopName);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.SELLER }
    }),
    prisma.shop.create({
      data: {
        sellerId: user.id,
        shopName,
        shopSlug,
        description: description ?? "A handmade home shop on Betsy Home.",
        location,
        countryCode,
        logoUrl,
        bannerUrl,
        announcement: "Welcome to our Betsy Home shop.",
        status: ShopStatus.PENDING_REVIEW
      }
    })
  ]);

  redirect("/seller/settings?created=1");
}
