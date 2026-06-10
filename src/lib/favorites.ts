import type { Prisma } from "@prisma/client";
import { getCurrentCustomerOrNull, getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const favoriteProductInclude = {
  product: {
    include: {
      shop: true,
      category: true,
      room: true,
      style: true,
      shippingProfile: true,
      images: {
        orderBy: {
          sortOrder: "asc" as const
        },
        take: 1
      },
      _count: {
        select: {
          reviews: true
        }
      }
    }
  }
};

type FavoriteWithProduct = Prisma.FavoriteGetPayload<{
  include: typeof favoriteProductInclude;
}>;

function mapFavorite(favorite: FavoriteWithProduct) {
  const product = favorite.product;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: Number(product.salePrice ?? product.price),
    rating: product.shop.rating,
    reviewCount: product._count.reviews || product.shop.totalSales,
    shopName: product.shop.shopName,
    shopSlug: product.shop.shopSlug,
    imageUrl:
      product.images[0]?.imageUrl ??
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
    category: product.category.name,
    categorySlug: product.category.slug,
    room: product.room?.name ?? "Home",
    roomSlug: product.room?.slug ?? null,
    style: product.style?.name ?? "Handmade",
    styleSlug: product.style?.slug ?? null,
    shippingNote: product.shippingProfile?.estimatedDeliveryText ?? "Shipping profile will be added by the seller",
    customizable: product.isCustomizable,
    favoritedAt: favorite.createdAt
  };
}

async function resolveProductForFavorite(productIdOrSlug: string, productSlug?: string | null) {
  const identifier = productIdOrSlug.trim();
  const slug = productSlug?.trim();

  if (!identifier && !slug) {
    return null;
  }

  const productById = identifier
    ? await prisma.product.findUnique({
        where: {
          id: identifier
        },
        select: {
          id: true
        }
      })
    : null;

  if (productById) {
    return productById;
  }

  const slugToCheck = slug || identifier;

  if (!slugToCheck) {
    return null;
  }

  return prisma.product.findUnique({
    where: {
      slug: slugToCheck
    },
    select: {
      id: true
    }
  });
}

export async function saveProductToFavorites(productIdOrSlug: string, productSlug?: string | null) {
  const customer = await getDemoCustomer();
  const product = await resolveProductForFavorite(productIdOrSlug, productSlug);

  if (!product) {
    return "not-found" as const;
  }

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: customer.id,
        productId: product.id
      }
    },
    update: {},
    create: {
      userId: customer.id,
      productId: product.id
    }
  });

  return "added" as const;
}

export async function removeProductFromFavorites(productIdOrSlug: string, productSlug?: string | null) {
  const customer = await getDemoCustomer();
  const product = await resolveProductForFavorite(productIdOrSlug, productSlug);

  if (!product) {
    return "not-found" as const;
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: customer.id,
      productId: product.id
    }
  });

  return "removed" as const;
}

export async function toggleProductFavorite(productIdOrSlug: string, productSlug?: string | null) {
  const customer = await getDemoCustomer();
  const product = await resolveProductForFavorite(productIdOrSlug, productSlug);

  if (!product) {
    return "not-found" as const;
  }

  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: customer.id,
        productId: product.id
      }
    },
    select: {
      id: true
    }
  });

  if (existingFavorite) {
    await prisma.favorite.delete({
      where: {
        id: existingFavorite.id
      }
    });

    return "removed" as const;
  }

  await prisma.favorite.create({
    data: {
      userId: customer.id,
      productId: product.id
    }
  });

  return "added" as const;
}

export async function isProductFavorited(productIdOrSlug: string, productSlug?: string | null) {
  const customer = await getCurrentCustomerOrNull();

  if (!customer) {
    return false;
  }

  const product = await resolveProductForFavorite(productIdOrSlug, productSlug);

  if (!product) {
    return false;
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: customer.id,
        productId: product.id
      }
    },
    select: {
      id: true
    }
  });

  return Boolean(favorite);
}

export async function getCustomerFavorites() {
  const customer = await getDemoCustomer();

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: customer.id
    },
    include: favoriteProductInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    customer,
    favorites: favorites.map(mapFavorite)
  };
}

export async function getCustomerFavoriteCount() {
  const customer = await getCurrentCustomerOrNull();

  if (!customer) {
    return 0;
  }

  return prisma.favorite.count({
    where: {
      userId: customer.id
    }
  });
}
