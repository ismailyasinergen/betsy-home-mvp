"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText, optionalText } from "@/lib/shop-utils";

export async function updateSellerShopSettings(formData: FormData) {
  const user = await requireRole([UserRole.SELLER], "/seller/settings");

  const shop = await prisma.shop.findFirst({
    where: {
      sellerId: user.id
    }
  });

  if (!shop) {
    redirect("/sell");
  }

  const shopName = cleanText(formData.get("shopName"));

  if (!shopName || shopName.length < 3) {
    redirect("/seller/settings?error=shop-name");
  }

  await prisma.shop.update({
    where: {
      id: shop.id
    },
    data: {
      shopName,
      description: optionalText(formData.get("description")),
      announcement: optionalText(formData.get("announcement")),
      logoUrl: optionalText(formData.get("logoUrl")),
      bannerUrl: optionalText(formData.get("bannerUrl")),
      location: optionalText(formData.get("location")),
      countryCode: optionalText(formData.get("countryCode"))?.toUpperCase() ?? null
    }
  });

  revalidatePath("/seller/settings");
  revalidatePath(`/shop/${shop.shopSlug}`);
  redirect("/seller/settings?saved=1");
}
