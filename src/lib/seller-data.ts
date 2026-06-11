import { ProductStatus, ShopStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getDemoSellerShop() {
  const { getSellerShopForCurrentUser } = await import("@/lib/seller-ownership");
  return getSellerShopForCurrentUser();
}

export async function getSellerListingFormData() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      categories: [],
      rooms: [],
      styles: [],
      shippingProfiles: []
    };
  }

  const [categories, rooms, styles, shippingProfiles] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.style.findMany({ orderBy: { name: "asc" } }),
    prisma.shippingProfile.findMany({
      where: {
        shopId: (shop as any).id
      },
      orderBy: {
        createdAt: "asc"
      }
    })
  ]);

  return {
    shop,
    categories,
    rooms,
    styles,
    shippingProfiles
  };
}

export async function getSellerListings() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      products: []
    };
  }

  const products = await prisma.product.findMany({
    where: {
      shopId: (shop as any).id,
      status: {
        in: [
          ProductStatus.ACTIVE,
          ProductStatus.DRAFT,
          ProductStatus.HIDDEN,
          ProductStatus.SOLD_OUT,
          ProductStatus.NEEDS_REVIEW
        ]
      }
    },
    include: {
      category: true,
      room: true,
      style: true,
      shippingProfile: true,
      images: {
        orderBy: {
          sortOrder: "asc"
        }
      },
      _count: {
        select: {
          favorites: true,
          orderItems: true,
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    shop,
    products
  };
}

export async function getSellerShippingProfiles() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      shippingProfiles: []
    };
  }

  const shippingProfiles = await prisma.shippingProfile.findMany({
    where: {
      shopId: (shop as any).id
    },
    include: {
      excludedCountries: {
        orderBy: {
          countryName: "asc"
        }
      },
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    shop,
    shippingProfiles
  };
}

export async function getSellerListingForEdit(productId: string) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      product: null,
      categories: [],
      rooms: [],
      styles: [],
      shippingProfiles: []
    };
  }

  const [product, categories, rooms, styles, shippingProfiles] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id: productId,
        shopId: (shop as any).id
      },
      include: {
        category: true,
        room: true,
        style: true,
        shippingProfile: true,
        images: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.style.findMany({ orderBy: { name: "asc" } }),
    prisma.shippingProfile.findMany({
      where: {
        shopId: (shop as any).id
      },
      orderBy: {
        createdAt: "asc"
      }
    })
  ]);

  return {
    shop,
    product,
    categories,
    rooms,
    styles,
    shippingProfiles
  };
}
