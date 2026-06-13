const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const taxonomy = [
  {
    name: "Home & Living",
    children: [
      {
        name: "Home Decor",
        children: [
          "Candles & Home Fragrances",
          "Wall Decor",
          "Mirrors",
          "Vases",
          "Picture Frames & Displays",
          "Clocks",
          "Decorative Storage",
          "Seasonal Decor"
        ]
      },
      {
        name: "Kitchen & Dining",
        children: [
          "Bakeware & Cookware",
          "Coffee & Tea Makers",
          "Dining & Serving",
          "Cutlery & Knives",
          "Kitchen Storage & Organization",
          "Pots & Pans"
        ]
      },
      {
        name: "Bedding",
        children: [
          "Bed Pillows",
          "Blankets & Throws",
          "Sheets & Pillowcases",
          "Duvet Covers"
        ]
      },
      {
        name: "Lighting",
        children: [
          "Ceiling Lighting",
          "Floor Lamps",
          "Table Lamps",
          "Wall Lighting",
          "Outdoor Lighting"
        ]
      },
      {
        name: "Bathroom",
        children: [
          "Bath Mats & Rugs",
          "Bath Towels",
          "Bathroom Storage",
          "Shower Curtains"
        ]
      },
      {
        name: "Curtains & Window Treatments",
        children: [
          "Curtains",
          "Blinds & Shades",
          "Curtain Hardware"
        ]
      },
      {
        name: "Storage & Organization",
        children: [
          "Baskets & Bins",
          "Shelving & Bookcases",
          "Hooks & Racks"
        ]
      },
      {
        name: "Cleaning Supplies",
        children: [
          "Air Fresheners",
          "Brooms & Mops",
          "Laundry Supplies"
        ]
      }
    ]
  },
  {
    name: "Furniture",
    children: [
      {
        name: "Living Room Furniture",
        children: [
          "Sofas & Couches",
          "Armchairs & Accent Chairs",
          "Coffee & End Tables",
          "TV Stands & Media Centers",
          "Ottomans & Poufs",
          "Bookshelves"
        ]
      },
      {
        name: "Bedroom Furniture",
        children: [
          "Beds & Headboards",
          "Dressers & Armoires",
          "Nightstands",
          "Vanity Tables"
        ]
      },
      {
        name: "Dining Room Furniture",
        children: [
          "Dining Tables",
          "Dining Chairs",
          "Buffets & China Cabinets"
        ]
      },
      {
        name: "Office Furniture",
        children: [
          "Desks",
          "Office Chairs",
          "Filing Cabinets"
        ]
      },
      {
        name: "Entryway & Mudroom Furniture",
        children: [
          "Hall Trees",
          "Standing Coat Racks",
          "Umbrella Stands",
          "Console Tables"
        ]
      },
      {
        name: "Kids' Furniture",
        children: [
          "Beds",
          "Desks & Chairs",
          "Storage & Toy Boxes"
        ]
      }
    ]
  },
  {
    name: "Outdoor & Garden",
    children: [
      {
        name: "Outdoor Furniture",
        children: [
          "Patio Sets",
          "Outdoor Chairs",
          "Garden Benches"
        ]
      },
      {
        name: "Garden Decor",
        children: []
      },
      {
        name: "Planters & Pots",
        children: []
      }
    ]
  }
];

async function upsertCategory(name, parentId = null) {
  const slug = slugify(name);

  return prisma.category.upsert({
    where: { slug },
    update: {
      name,
      parentId
    },
    create: {
      name,
      slug,
      parentId
    }
  });
}

async function main() {
  for (const top of taxonomy) {
    const topCategory = await upsertCategory(top.name);

    for (const sub of top.children) {
      const subCategory = await upsertCategory(sub.name, topCategory.id);

      for (const childName of sub.children) {
        await upsertCategory(childName, subCategory.id);
      }
    }
  }

  console.log("Home taxonomy seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
