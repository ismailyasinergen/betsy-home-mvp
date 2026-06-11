import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

const catalogueProductInclude = {
  category: true,
  room: true,
  style: true,
  shippingProfile: {
    include: {
      excludedCountries: {
        orderBy: {
          countryName: "asc" as const
        }
      }
    }
  },
  images: {
    orderBy: {
      sortOrder: "asc" as const
    }
  }
};

export async function getCatalogueBuilderData() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      products: [],
      catalogues: []
    };
  }

  const [products, catalogues] = await Promise.all([
    prisma.product.findMany({
      where: {
        shopId: (shop as any).id,
        status: ProductStatus.ACTIVE
      },
      include: catalogueProductInclude,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.pdfCatalogue.findMany({
      where: {
        shopId: (shop as any).id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8
    })
  ]);

  return {
    shop,
    products,
    catalogues
  };
}

export async function getCataloguePreviewData(id: string) {
  const catalogue = await prisma.pdfCatalogue.findUnique({
    where: {
      id
    },
    include: {
      shop: true
    }
  });

  if (!catalogue) {
    return null;
  }

  const selectedIds = catalogue.selectedProductIds;

  const products = await prisma.product.findMany({
    where: {
      shopId: catalogue.shopId,
      status: ProductStatus.ACTIVE,
      ...(selectedIds.length > 0 ? { id: { in: selectedIds } } : {})
    },
    include: catalogueProductInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    catalogue,
    shop: catalogue.shop,
    products
  };
}

export function getTemplateLabel(template: string) {
  switch (template) {
    case "LUXURY_LOOKBOOK":
      return "Luxury Lookbook";
    case "WHOLESALE":
      return "Wholesale Catalogue";
    case "PRICE_LIST":
      return "Simple Price List";
    default:
      return "Clean Grid Catalogue";
  }
}
