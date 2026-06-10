import { PrismaClient, ProductOrigin, ProductStatus, ProductType, ShopStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.collectionProduct.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shippingExcludedCountry.deleteMany();
  await prisma.shippingProfile.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.room.deleteMany();
  await prisma.style.deleteMany();

  const wallArt = await prisma.category.create({ data: { name: "Wall Art", slug: "wall-art" } });
  const ceramics = await prisma.category.create({ data: { name: "Ceramics", slug: "ceramics" } });
  const candles = await prisma.category.create({ data: { name: "Candles", slug: "candles" } });

  const livingRoom = await prisma.room.create({ data: { name: "Living Room", slug: "living-room" } });
  const bedroom = await prisma.room.create({ data: { name: "Bedroom", slug: "bedroom" } });
  const kitchen = await prisma.room.create({ data: { name: "Kitchen", slug: "kitchen" } });

  const boho = await prisma.style.create({ data: { name: "Boho", slug: "boho" } });
  const minimalist = await prisma.style.create({ data: { name: "Minimalist", slug: "minimalist" } });
  const mediterranean = await prisma.style.create({ data: { name: "Mediterranean", slug: "mediterranean" } });

  const seller = await prisma.user.create({
    data: {
      email: "seller@betsyhome.test",
      name: "Luna Clay Studio",
      role: UserRole.SELLER
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@betsyhome.test",
      name: "Betsy Admin",
      role: UserRole.ADMIN
    }
  });

  await prisma.user.create({
    data: {
      email: "customer@betsyhome.test",
      name: "Demo Customer",
      role: UserRole.CUSTOMER
    }
  });

  const shop = await prisma.shop.create({
    data: {
      sellerId: seller.id,
      shopName: "Luna Clay Studio",
      shopSlug: "luna-clay-studio",
      description: "Handmade ceramics for calm, beautiful homes.",
      location: "Izmir, Türkiye",
      countryCode: "TR",
      status: ShopStatus.ACTIVE,
      rating: 4.9,
      totalSales: 124
    }
  });

  const shippingProfile = await prisma.shippingProfile.create({
    data: {
      shopId: shop.id,
      profileName: "International Handmade Decor Shipping",
      shipsFromCountry: "TR",
      processingTimeMin: 3,
      processingTimeMax: 5,
      domesticShippingPrice: 5,
      internationalShippingEnabled: true,
      freeShippingEnabled: false,
      estimatedDeliveryText: "Ships in 3–5 business days",
      excludedCountries: {
        create: [
          { countryCode: "RU", countryName: "Russia" },
          { countryCode: "BY", countryName: "Belarus" },
          { countryCode: "KP", countryName: "North Korea" }
        ]
      }
    }
  });

  const products = [
    {
      title: "Handmade Ceramic Vase",
      slug: "handmade-ceramic-vase",
      description: "A softly textured ceramic vase made for shelves, coffee tables, and calm living rooms.",
      price: 38,
      categoryId: ceramics.id,
      roomId: livingRoom.id,
      styleId: minimalist.id,
      materials: ["Stoneware clay", "Matte glaze"],
      dimensions: "18 cm high x 9 cm wide",
      bestFor: ["Coffee tables", "Shelves", "Entryway consoles"],
      imageUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=1200&auto=format&fit=crop"
    },
    {
      title: "Botanical Wall Print Set",
      slug: "botanical-wall-print-set",
      description: "A warm botanical print set for bedrooms, reading corners, and home offices.",
      price: 24,
      categoryId: wallArt.id,
      roomId: bedroom.id,
      styleId: boho.id,
      materials: ["Fine art paper", "Archival ink"],
      dimensions: "A4 / A3 options",
      bestFor: ["Bedrooms", "Gallery walls", "Home offices"],
      imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"
    },
    {
      title: "Olive Grove Soy Candle",
      slug: "olive-grove-soy-candle",
      description: "A hand-poured soy candle inspired by Mediterranean olive groves.",
      price: 18,
      categoryId: candles.id,
      roomId: kitchen.id,
      styleId: mediterranean.id,
      materials: ["Soy wax", "Cotton wick", "Glass jar"],
      dimensions: "220 g",
      bestFor: ["Kitchen counters", "Dining tables", "Gift boxes"],
      imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        shopId: shop.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        quantity: 12,
        sku: product.slug.toUpperCase().replaceAll("-", "_").slice(0, 24),
        categoryId: product.categoryId,
        roomId: product.roomId,
        styleId: product.styleId,
        shippingProfileId: shippingProfile.id,
        status: ProductStatus.ACTIVE,
        productType: ProductType.PHYSICAL,
        origin: ProductOrigin.HANDMADE,
        isCustomizable: true,
        personalizationHint: "Add a gift note or request a custom color.",
        materials: product.materials,
        dimensions: product.dimensions,
        bestFor: product.bestFor,
        tags: ["handmade", "home decor", "betsy home"],
        searchKeywords: [product.title, "handmade home", "decor"],
        images: {
          create: [{ imageUrl: product.imageUrl, altText: product.title, sortOrder: 0 }]
        }
      }
    });
  }

  await prisma.collection.create({
    data: {
      title: "Fresh Finds for Your Home",
      slug: "fresh-finds-for-your-home",
      description: "A curated launch collection of warm handmade pieces."
    }
  });

  console.log({ admin: admin.email, seller: seller.email });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
