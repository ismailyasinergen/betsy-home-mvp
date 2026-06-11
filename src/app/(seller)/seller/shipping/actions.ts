"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCountryName } from "@/lib/countries";
import { getDemoSellerShop } from "@/lib/seller-data";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getRequiredInteger(formData: FormData, key: string, fallback: number) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function getExcludedCountries(formData: FormData) {
  const values = formData.getAll("excludedCountries");
  const countries = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => {
      const [countryCode, ...nameParts] = value.split("|");
      const code = countryCode.trim().toUpperCase();
      const name = nameParts.join("|").trim() || getCountryName(code);

      return {
        countryCode: code,
        countryName: name
      };
    })
    .filter((country) => country.countryCode.length > 0);

  return Array.from(new Map(countries.map((country) => [country.countryCode, country])).values());
}

export async function createShippingProfile(formData: FormData) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    throw new Error("No seller shop was found. Run npm run seed first, then try again.");
  }

  const profileName = getString(formData, "profileName");
  const shipsFromCountry = getString(formData, "shipsFromCountry");
  const processingTimeMin = getRequiredInteger(formData, "processingTimeMin", 1);
  const processingTimeMax = getRequiredInteger(formData, "processingTimeMax", processingTimeMin);
  const domesticShippingPrice = getOptionalNumber(formData, "domesticShippingPrice");
  const estimatedDeliveryText = getString(formData, "estimatedDeliveryText") || `${processingTimeMin}-${Math.max(processingTimeMax, processingTimeMin)} business days`;
  const internationalShippingEnabled = formData.get("internationalShippingEnabled") === "on";
  const freeShippingEnabled = formData.get("freeShippingEnabled") === "on";
  const excludedCountries = getExcludedCountries(formData);

  if (!profileName || !shipsFromCountry) {
    throw new Error("Profile name and ships-from country are required.");
  }

  await prisma.shippingProfile.create({
    data: {
      shopId: (shop as any).id,
      profileName,
      shipsFromCountry,
      processingTimeMin,
      processingTimeMax: Math.max(processingTimeMax, processingTimeMin),
      domesticShippingPrice,
      internationalShippingEnabled,
      freeShippingEnabled,
      estimatedDeliveryText,
      excludedCountries: excludedCountries.length
        ? {
            create: excludedCountries
          }
        : undefined
    }
  });

  revalidatePath("/seller/shipping");
  revalidatePath("/seller/listings/new");
  revalidatePath("/search");
  revalidatePath("/");
}

export async function deleteShippingProfile(formData: FormData) {
  const shop = await getDemoSellerShop();
  const profileId = getString(formData, "profileId");

  if (!shop || !profileId) {
    throw new Error("Shipping profile could not be deleted.");
  }

  await prisma.$transaction([
    prisma.product.updateMany({
      where: {
        shopId: (shop as any).id,
        shippingProfileId: profileId
      },
      data: {
        shippingProfileId: null
      }
    }),
    prisma.shippingProfile.delete({
      where: {
        id: profileId,
        shopId: (shop as any).id
      }
    })
  ]);

  revalidatePath("/seller/shipping");
  revalidatePath("/seller/listings/new");
  revalidatePath("/search");
  revalidatePath("/");
}
