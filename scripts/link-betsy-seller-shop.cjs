const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const sellerEmail = process.argv[2] || "betsywaow@gmail.com";
  const shopTitle = process.argv[3] || "Betsy Clay Atelier";

  const user = await prisma.user.findUnique({ where: { email: sellerEmail } });
  if (!user) {
    console.log(`Seller user not found: ${sellerEmail}`);
    process.exitCode = 1;
    return;
  }

  const shopModel = Prisma.dmmf.datamodel.models.find((model) => model.name === "Shop");
  if (!shopModel) {
    console.log("Shop model not found in Prisma schema.");
    process.exitCode = 1;
    return;
  }

  const shopFields = new Set(shopModel.fields.map((field) => field.name));
  const shopNameFields = ["shopName", "name", "title"].filter((field) => shopFields.has(field));

  if (shopNameFields.length === 0) {
    console.log("Could not find a shop name field. Shop fields:", [...shopFields]);
    process.exitCode = 1;
    return;
  }

  const OR = shopNameFields.map((field) => ({ [field]: shopTitle }));
  const shop = await prisma.shop.findFirst({ where: { OR } });

  if (!shop) {
    console.log(`Shop not found: ${shopTitle}`);
    const select = { id: true };
    for (const field of shopNameFields) select[field] = true;
    const shops = await prisma.shop.findMany({ select });
    console.log("Existing shops:", shops);
    process.exitCode = 1;
    return;
  }

  const data = {};
  for (const field of ["sellerId", "ownerId", "userId"]) {
    if (shopFields.has(field)) data[field] = user.id;
  }

  if (Object.keys(data).length === 0) {
    console.log("No sellerId, ownerId, or userId field exists on Shop. Shop fields:", [...shopFields]);
    process.exitCode = 1;
    return;
  }

  const updated = await prisma.shop.update({ where: { id: shop.id }, data });

  console.log("Linked shop to seller successfully:");
  console.log({ sellerEmail, userId: user.id, shopId: updated.id, linkedFields: data });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
