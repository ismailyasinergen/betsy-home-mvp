from pathlib import Path
import re

ROOT = Path.cwd()
SRC = ROOT / "src"

if not SRC.exists():
    raise SystemExit("Run this script from the Betsy Home project root, where the src folder exists.")

# 1) Add a production-safe seller ownership helper.
helper = SRC / "lib" / "seller-ownership.ts"
helper.parent.mkdir(parents=True, exist_ok=True)
helper.write_text(r'''import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function isDemoFallbackAllowed() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEMO_SELLER_FALLBACKS_ENABLED !== "false"
  );
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    console.warn("[seller ownership] query failed; using fallback result.");
    return fallback;
  }
}

export async function getSellerShopForCurrentUser() {
  const db = prisma as any;
  const currentUser = await safe(getCurrentUser(), null as any);

  if (!currentUser?.id && !currentUser?.email) {
    return null;
  }

  if (currentUser?.id) {
    const bySellerId = await safe(
      db.shop.findFirst({ where: { sellerId: currentUser.id } }),
      null
    );
    if (bySellerId) return bySellerId;

    const byOwnerId = await safe(
      db.shop.findFirst({ where: { ownerId: currentUser.id } }),
      null
    );
    if (byOwnerId) return byOwnerId;

    const byUserId = await safe(
      db.shop.findFirst({ where: { userId: currentUser.id } }),
      null
    );
    if (byUserId) return byUserId;
  }

  if (currentUser?.email) {
    const byOwnerEmail = await safe(
      db.shop.findFirst({ where: { owner: { email: currentUser.email } } }),
      null
    );
    if (byOwnerEmail) return byOwnerEmail;

    const bySellerEmail = await safe(
      db.shop.findFirst({ where: { seller: { email: currentUser.email } } }),
      null
    );
    if (bySellerEmail) return bySellerEmail;
  }

  // Local demo rescue only. This must never run in production.
  if (isDemoFallbackAllowed() && currentUser?.email?.toLowerCase() === "betsywaow@gmail.com") {
    const betsyShop =
      (await safe(db.shop.findFirst({ where: { shopName: "Betsy Clay Atelier" } }), null)) ??
      (await safe(db.shop.findFirst({ where: { name: "Betsy Clay Atelier" } }), null));

    if (betsyShop) return betsyShop;
  }

  return null;
}

export async function requireSellerShopForCurrentUser() {
  const shop = await getSellerShopForCurrentUser();

  if (!shop?.id) {
    throw new Error("No seller shop is linked to the current user.");
  }

  return shop;
}

export async function sellerOwnsShop(shopId: string) {
  const shop = await getSellerShopForCurrentUser();
  return Boolean(shop?.id && shop.id === shopId);
}

export async function sellerOwnsOrder(orderId: string) {
  const db = prisma as any;
  const shop = await getSellerShopForCurrentUser();
  if (!shop?.id) return false;

  const order = await safe(
    db.order.findFirst({ where: { id: orderId, shopId: shop.id }, select: { id: true } }),
    null
  );

  return Boolean(order?.id);
}

export async function sellerOwnsProduct(productId: string) {
  const db = prisma as any;
  const shop = await getSellerShopForCurrentUser();
  if (!shop?.id) return false;

  const product = await safe(
    db.product.findFirst({ where: { id: productId, shopId: shop.id }, select: { id: true } }),
    null
  );

  return Boolean(product?.id);
}
''', encoding='utf-8')

# 2) Patch seller-data.ts so existing pages can use the safer helper without broad fallback.
seller_data = SRC / "lib" / "seller-data.ts"
if seller_data.exists():
    s = seller_data.read_text(encoding="utf-8")
    start = s.find("export async function getDemoSellerShop")
    if start != -1:
        brace = s.find("{", start)
        depth = 0
        end = None
        for i in range(brace, len(s)):
            if s[i] == "{":
                depth += 1
            elif s[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end:
            replacement = '''export async function getDemoSellerShop() {
  const { getSellerShopForCurrentUser } = await import("@/lib/seller-ownership");
  return getSellerShopForCurrentUser();
}'''
            s = s[:start] + replacement + s[end:]
            seller_data.write_text(s, encoding="utf-8")
            print("Patched src/lib/seller-data.ts to use seller-ownership helper.")
        else:
            print("Could not safely replace getDemoSellerShop body; left seller-data.ts unchanged.")
    else:
        print("getDemoSellerShop not found; seller-data.ts left unchanged.")
else:
    print("src/lib/seller-data.ts not found; skipped.")

# 3) Make seller analytics import and use the central helper if it currently calls getDemoSellerShop.
analytics = SRC / "app" / "(seller)" / "seller" / "analytics" / "page.tsx"
if analytics.exists():
    s = analytics.read_text(encoding="utf-8")
    if "@/lib/seller-ownership" not in s:
        s = s.replace('import { getDemoSellerShop } from "@/lib/seller-data";', 'import { getSellerShopForCurrentUser } from "@/lib/seller-ownership";')
        s = s.replace("getDemoSellerShop()", "getSellerShopForCurrentUser()")
    else:
        s = s.replace("getDemoSellerShop()", "getSellerShopForCurrentUser()")
    analytics.write_text(s, encoding="utf-8")
    print("Patched seller analytics page to use seller ownership helper when applicable.")
else:
    print("Seller analytics page not found; skipped.")

# 4) Add local-only demo flag to .env if missing.
env = ROOT / ".env"
if env.exists():
    s = env.read_text(encoding="utf-8")
    if "DEMO_SELLER_FALLBACKS_ENABLED" not in s:
        if not s.endswith("\n"):
            s += "\n"
        s += "DEMO_SELLER_FALLBACKS_ENABLED=true\n"
        env.write_text(s, encoding="utf-8")
        print("Added DEMO_SELLER_FALLBACKS_ENABLED=true to .env for local development.")
else:
    print(".env not found; skipped local demo flag.")

# 5) Add a shop-link helper script for proper DB ownership linking.
scripts = ROOT / "scripts"
scripts.mkdir(exist_ok=True)
link = scripts / "link-betsy-seller-shop.cjs"
link.write_text(r'''const { PrismaClient, Prisma } = require("@prisma/client");

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
''', encoding='utf-8')
print("Added scripts/link-betsy-seller-shop.cjs.")

print("\nProduction seller ownership hardening patch applied.")
