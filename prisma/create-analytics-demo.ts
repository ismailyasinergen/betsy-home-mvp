import { PrismaClient, PaymentStatus, ProductOrigin, ProductStatus, ProductType, ShippingStatus, ShopStatus, UserRole, CustomOrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

function makeOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BH-${stamp}-DEMO-${rand}`;
}

async function main() {
  const sellerShop = await prisma.shop.findFirst({
    where: {
      status: {
        in: [ShopStatus.ACTIVE, ShopStatus.PENDING_REVIEW, ShopStatus.DRAFT]
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      seller: true,
      products: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          images: true,
          shippingProfile: true
        }
      },
      shippingProfiles: true
    }
  });

  if (!sellerShop) {
    throw new Error("No seller shop found. Create a seller shop first from /sell, then run this script again.");
  }

  const customer = await prisma.user.upsert({
    where: { email: "analytics-buyer@betsyhome.test" },
    update: {
      name: "Analytics Demo Buyer",
      role: UserRole.CUSTOMER,
      emailVerifiedAt: new Date()
    },
    create: {
      name: "Analytics Demo Buyer",
      email: "analytics-buyer@betsyhome.test",
      role: UserRole.CUSTOMER,
      emailVerifiedAt: new Date()
    }
  });

  const category = await prisma.category.findFirst({ where: { slug: "ceramics" } }) ?? await prisma.category.create({
    data: {
      name: "Ceramics",
      slug: "ceramics"
    }
  });

  const room = await prisma.room.findFirst({ where: { slug: "living-room" } }) ?? await prisma.room.create({
    data: {
      name: "Living Room",
      slug: "living-room"
    }
  });

  const style = await prisma.style.findFirst({ where: { slug: "minimalist" } }) ?? await prisma.style.create({
    data: {
      name: "Minimalist",
      slug: "minimalist"
    }
  });

  const shippingProfile = sellerShop.shippingProfiles[0] ?? await prisma.shippingProfile.create({
    data: {
      shopId: sellerShop.id,
      profileName: "Analytics Demo Standard Shipping",
      shipsFromCountry: sellerShop.countryCode ?? "TR",
      processingTimeMin: 3,
      processingTimeMax: 5,
      domesticShippingPrice: "9.90",
      internationalShippingEnabled: true,
      estimatedDeliveryText: "Ships in 3–5 business days",
      excludedCountries: {
        create: [
          { countryCode: "RU", countryName: "Russia" },
          { countryCode: "BY", countryName: "Belarus" },
          { countryCode: "IR", countryName: "Iran" }
        ]
      }
    }
  });

  let product = sellerShop.products.find((item) => item.status === ProductStatus.ACTIVE) ?? sellerShop.products[0];

  if (!product) {
    const slugSuffix = Math.random().toString(36).slice(2, 7);
    product = await prisma.product.create({
      data: {
        shopId: sellerShop.id,
        title: "Analytics Demo Ceramic Candle Holder",
        slug: `analytics-demo-ceramic-candle-holder-${slugSuffix}`,
        description: "A handmade ceramic candle holder created to populate seller analytics with realistic demo data.",
        price: "29.00",
        salePrice: "24.00",
        quantity: 18,
        sku: `DEMO-CANDLE-${slugSuffix.toUpperCase()}`,
        categoryId: category.id,
        roomId: room.id,
        styleId: style.id,
        shippingProfileId: shippingProfile.id,
        status: ProductStatus.ACTIVE,
        productType: ProductType.PHYSICAL,
        origin: ProductOrigin.HANDMADE,
        isCustomizable: true,
        personalizationHint: "Request a custom glaze color or add a gift note.",
        materials: ["Ceramic", "Natural clay", "Matte glaze"],
        dimensions: "Height: 9 cm, Width: 11 cm, Candle opening: 4 cm",
        careInstructions: "Wipe gently with a soft dry cloth.",
        bestFor: ["Living room", "Coffee table", "Boutique hotel rooms"],
        tags: ["ceramic", "candle holder", "handmade"],
        searchKeywords: ["ceramic candle holder", "sage green decor"],
        images: {
          create: {
            imageUrl: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?q=80&w=1200&auto=format&fit=crop",
            altText: "Handmade ceramic candle holder",
            sortOrder: 0
          }
        }
      },
      include: {
        images: true,
        shippingProfile: true
      }
    });
  } else if (!product.shippingProfileId) {
    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        shippingProfileId: shippingProfile.id,
        status: ProductStatus.ACTIVE
      },
      include: {
        images: true,
        shippingProfile: true
      }
    });
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

  const unitPrice = product.salePrice ?? product.price;
  const order = await prisma.order.create({
    data: {
      buyerId: customer.id,
      shopId: sellerShop.id,
      orderNumber: makeOrderNumber(),
      subtotal: unitPrice,
      shippingTotal: "9.90",
      taxTotal: "0.00",
      platformFee: "2.40",
      total: Number(unitPrice) + 9.9,
      paymentStatus: PaymentStatus.PAID,
      shippingStatus: ShippingStatus.NEW,
      shippingAddress: {
        fullName: "Analytics Demo Buyer",
        line1: "Demo Street 12",
        city: "Berlin",
        postalCode: "10115",
        countryCode: "DE",
        countryName: "Germany"
      },
      items: {
        create: {
          productId: product.id,
          titleSnapshot: product.title,
          priceSnapshot: unitPrice,
          quantity: 1,
          personalizationText: "Please wrap this as a housewarming gift."
        }
      }
    },
    include: {
      items: true
    }
  });

  await prisma.review.create({
    data: {
      orderId: order.id,
      productId: product.id,
      buyerId: customer.id,
      shopId: sellerShop.id,
      rating: 4,
      comment: "Beautiful handmade piece with a lovely finish. It looks great on my living room shelf. Shipping was smooth and the packaging felt secure."
    }
  });

  await prisma.customOrderRequest.create({
    data: {
      buyerId: customer.id,
      shopId: sellerShop.id,
      productId: product.id,
      desiredSize: "35 cm tall",
      desiredColor: "matte sage green",
      quantity: 3,
      budget: "150.00",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      shippingCountry: "Germany",
      referenceImageUrl: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1200&auto=format&fit=crop",
      message: "I would like three matching pieces for a living room project. Can you make this color and size?",
      status: CustomOrderStatus.OPEN
    }
  });

  await prisma.shop.update({
    where: { id: sellerShop.id },
    data: {
      totalSales: {
        increment: 1
      }
    }
  });

  console.log("Demo analytics data created successfully:");
  console.log({
    shop: sellerShop.shopName,
    customer: customer.email,
    product: product.title,
    order: order.orderNumber,
    paymentStatus: "PAID",
    review: "4 stars",
    customRequest: "OPEN",
    favorite: "created"
  });
}

main()
  .catch((error) => {
    console.error("Failed to create demo analytics data:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
