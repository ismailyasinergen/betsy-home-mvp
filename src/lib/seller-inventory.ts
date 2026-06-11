import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

const inventoryInclude = {
  category: true,
  room: true,
  style: true,
  shippingProfile: true,
  images: {
    orderBy: {
      sortOrder: "asc" as const
    }
  },
  _count: {
    select: {
      orderItems: true,
      favorites: true,
      reviews: true
    }
  }
};

export async function getSellerInventoryData() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      products: [],
      shippingProfiles: [],
      lowStockProducts: [],
      soldOutProducts: [],
      missingShippingProducts: [],
      needsReviewProducts: [],
      metrics: {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        soldOutProducts: 0,
        missingShippingProducts: 0,
        needsReviewProducts: 0,
        totalUnits: 0
      }
    };
  }

  const [products, shippingProfiles] = await Promise.all([
    prisma.product.findMany({
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
      include: inventoryInclude,
      orderBy: [{ status: "asc" }, { quantity: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.shippingProfile.findMany({
      where: {
        shopId: (shop as any).id
      },
      orderBy: {
        profileName: "asc"
      }
    })
  ]);

  const lowStockProducts = products.filter(
    (product) => product.status === ProductStatus.ACTIVE && product.quantity > 0 && product.quantity <= 3
  );
  const soldOutProducts = products.filter(
    (product) => product.status === ProductStatus.SOLD_OUT || product.quantity <= 0
  );
  const missingShippingProducts = products.filter(
    (product) =>
      ([ProductStatus.ACTIVE, ProductStatus.DRAFT, ProductStatus.NEEDS_REVIEW] as ProductStatus[]).includes(product.status) &&
      !product.shippingProfileId
  );
  const needsReviewProducts = products.filter((product) => product.status === ProductStatus.NEEDS_REVIEW);

  return {
    shop,
    products,
    shippingProfiles,
    lowStockProducts,
    soldOutProducts,
    missingShippingProducts,
    needsReviewProducts,
    metrics: {
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.status === ProductStatus.ACTIVE).length,
      lowStockProducts: lowStockProducts.length,
      soldOutProducts: soldOutProducts.length,
      missingShippingProducts: missingShippingProducts.length,
      needsReviewProducts: needsReviewProducts.length,
      totalUnits: products.reduce((total, product) => total + Math.max(0, product.quantity), 0)
    }
  };
}
