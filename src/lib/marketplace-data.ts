import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const productInclude = {
  shop: true,
  category: true,
  room: true,
  style: true,
  shippingProfile: {
    include: {
      excludedCountries: {
        orderBy: {
          countryName: "asc"
        }
      }
    }
  },
  images: {
    orderBy: {
      sortOrder: "asc"
    }
  },
  reviews: {
    include: {
      buyer: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  },
  _count: {
    select: {
      reviews: true
    }
  }
} satisfies Prisma.ProductInclude;

type ProductWithMarketplaceRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export type ProductReviewPreview = {
  id: string;
  rating: number;
  comment: string | null;
  sellerResponse: string | null;
  buyerName: string;
  createdAt: Date;
};

export type ProductCardData = {
  id: string;
  title: string;
  slug: string;
  price: number;
  rating: number;
  reviewCount: number;
  shopName: string;
  shopSlug: string;
  shopId: string;
  imageUrl: string;
  category: string;
  categorySlug: string;
  room: string;
  roomSlug: string | null;
  style: string;
  styleSlug: string | null;
  shippingNote: string;
  customizable: boolean;
};

export type ProductDetailData = ProductCardData & {
  description: string;
  materials: string[];
  dimensions: string | null;
  careInstructions: string | null;
  bestFor: string[];
  personalizationHint: string | null;
  quantity: number;
  excludedCountries: {
    countryCode: string;
    countryName: string;
  }[];
  reviews: ProductReviewPreview[];
};

function getProductRating(product: ProductWithMarketplaceRelations) {
  if (product.reviews.length === 0) {
    return product.shop.rating;
  }

  const averageRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
  return Number(averageRating.toFixed(1));
}

function mapProduct(product: ProductWithMarketplaceRelations): ProductDetailData {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: Number(product.salePrice ?? product.price),
    rating: getProductRating(product),
    reviewCount: product._count.reviews || product.shop.totalSales,
    shopName: product.shop.shopName,
    shopSlug: product.shop.shopSlug,
    shopId: product.shop.id,
    imageUrl:
      product.images[0]?.imageUrl ??
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
    category: product.category.name,
    categorySlug: product.category.slug,
    room: product.room?.name ?? "Home",
    roomSlug: product.room?.slug ?? null,
    style: product.style?.name ?? "Handmade",
    styleSlug: product.style?.slug ?? null,
    shippingNote:
      product.shippingProfile?.estimatedDeliveryText ??
      "Shipping profile will be added by the seller",
    customizable: product.isCustomizable,
    materials: product.materials,
    dimensions: product.dimensions,
    careInstructions: product.careInstructions,
    bestFor: product.bestFor,
    personalizationHint: product.personalizationHint,
    quantity: product.quantity,
    excludedCountries:
      product.shippingProfile?.excludedCountries.map((country) => ({
        countryCode: country.countryCode,
        countryName: country.countryName
      })) ?? [],
    reviews: product.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      sellerResponse: review.sellerResponse,
      buyerName: review.buyer.name ?? "Betsy Home customer",
      createdAt: review.createdAt
    }))
  };
}

const activeProductWhere = {
  status: ProductStatus.ACTIVE
} satisfies Prisma.ProductWhereInput;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function marketplaceSafe<T>(
  label: string,
  fallback: T,
  operation: () => Promise<T>,
  attempts = 3
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[marketplace] ${label} failed on attempt ${attempt}`, error);

      if (attempt < attempts) {
        await wait(300 * attempt);
      }
    }
  }

  console.warn(`[marketplace] ${label} using fallback`, lastError);
  return fallback;
}

export async function getHomePageData() {
  return marketplaceSafe("home page data", { products: [], categories: [], rooms: [], styles: [] }, async () => {
    const [products, categories, rooms, styles] = await Promise.all([
      prisma.product.findMany({
        where: activeProductWhere,
        include: productInclude,
        orderBy: {
          createdAt: "desc"
        },
        take: 8
      }),
      prisma.category.findMany({
        orderBy: {
          name: "asc"
        }
      }),
      prisma.room.findMany({
        orderBy: {
          name: "asc"
        }
      }),
      prisma.style.findMany({
        orderBy: {
          name: "asc"
        }
      })
    ]);

    return {
      products: products.map(mapProduct),
      categories,
      rooms,
      styles
    };
  });
}

export async function getFiltersData() {
  return marketplaceSafe("filters data", { categories: [], rooms: [], styles: [] }, async () => {
    const [categories, rooms, styles] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.room.findMany({ orderBy: { name: "asc" } }),
      prisma.style.findMany({ orderBy: { name: "asc" } })
    ]);

    return { categories, rooms, styles };
  });
}

export async function getFeaturedProducts(limit = 4) {
  return marketplaceSafe("featured products", [], async () => {
    const products = await prisma.product.findMany({
      where: activeProductWhere,
      include: productInclude,
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    return products.map(mapProduct);
  });
}

export async function getProductBySlug(slug: string) {
  return marketplaceSafe(`product by slug ${slug}`, null, async () => {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.ACTIVE
      },
      include: productInclude
    });

    if (!product) {
      return null;
    }

    return mapProduct(product);
  });
}

export async function getSearchProducts(query?: string) {
  return marketplaceSafe("search products", [], async () => {
    const cleanQuery = query?.trim();

    const where: Prisma.ProductWhereInput = cleanQuery
      ? {
          status: ProductStatus.ACTIVE,
          OR: [
            { title: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
            { category: { name: { contains: cleanQuery, mode: "insensitive" } } },
            { room: { name: { contains: cleanQuery, mode: "insensitive" } } },
            { style: { name: { contains: cleanQuery, mode: "insensitive" } } },
            { shop: { shopName: { contains: cleanQuery, mode: "insensitive" } } }
          ]
        }
      : activeProductWhere;

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: {
        createdAt: "desc"
      },
      take: 48
    });

    return products.map(mapProduct);
  });
}

export async function getCategoryProducts(slug: string) {
  return marketplaceSafe(`category products ${slug}`, { category: null, products: [] }, async () => {
    const [category, products] = await Promise.all([
      prisma.category.findUnique({ where: { slug } }),
      prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          category: {
            slug
          }
        },
        include: productInclude,
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    return {
      category,
      products: products.map(mapProduct)
    };
  });
}

export async function getRoomProducts(slug: string) {
  return marketplaceSafe(`room products ${slug}`, { room: null, products: [] }, async () => {
    const [room, products] = await Promise.all([
      prisma.room.findUnique({ where: { slug } }),
      prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          room: {
            slug
          }
        },
        include: productInclude,
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    return {
      room,
      products: products.map(mapProduct)
    };
  });
}

export async function getStyleProducts(slug: string) {
  return marketplaceSafe(`style products ${slug}`, { style: null, products: [] }, async () => {
    const [style, products] = await Promise.all([
      prisma.style.findUnique({ where: { slug } }),
      prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          style: {
            slug
          }
        },
        include: productInclude,
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    return {
      style,
      products: products.map(mapProduct)
    };
  });
}
