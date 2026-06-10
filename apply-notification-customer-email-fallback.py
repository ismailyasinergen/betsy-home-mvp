#!/usr/bin/env python3
from pathlib import Path
import re

path = Path("src/lib/notification-events.ts")
if not path.exists():
    raise SystemExit("src/lib/notification-events.ts not found. Run this from the project root.")

s = path.read_text(encoding="utf-8")
original = s

if "async function findDemoCustomerEmail" not in s:
    helper = r'''

async function findDemoCustomerEmail() {
  try {
    const user = await (prisma as any).user.findFirst({
      where: {
        OR: [
          { email: "customer@betsyhome.test" },
          { role: "CUSTOMER" },
          { role: "BUYER" },
        ],
      },
      select: { email: true },
    });

    return user?.email ?? undefined;
  } catch {
    return undefined;
  }
}

async function findUserEmailByAnyId(id: string | null | undefined) {
  if (!id) return undefined;

  try {
    const user = await (prisma as any).user.findFirst({
      where: { id },
      select: { email: true },
    });

    return user?.email ?? undefined;
  } catch {
    return undefined;
  }
}
'''
    match = re.search(r"\n(type|function|async function)\s+", s)
    if match:
        s = s[:match.start()] + helper + s[match.start():]
    else:
        s = helper + "\n" + s
    print("added customer email helper functions")

replacement = r'''async function resolveCustomerEmail(order: any) {
  const directEmail =
    order?.customerEmail ??
    order?.buyerEmail ??
    order?.email ??
    order?.contactEmail ??
    order?.customer?.email ??
    order?.buyer?.email ??
    order?.user?.email;

  if (directEmail) return directEmail;

  const possibleIds = [
    order?.customerId,
    order?.buyerId,
    order?.userId,
    order?.customerUserId,
    order?.accountId,
  ].filter(Boolean);

  for (const id of possibleIds) {
    const email = await findUserEmailByAnyId(String(id));
    if (email) return email;
  }

  return findDemoCustomerEmail();
}'''

pattern = re.compile(r"async function resolveCustomerEmail\s*\([^)]*\)\s*\{.*?\n\}", re.DOTALL)

if "async function resolveCustomerEmail" in s:
    s, count = pattern.subn(replacement, s, count=1)
    print("patched resolveCustomerEmail" if count else "could not auto-replace resolveCustomerEmail")
else:
    print("resolveCustomerEmail not found; using inline payload replacement only")

s = re.sub(
    r"customerEmail:\s*value<string>\(order,\s*\[[^\]]+\]\),",
    "customerEmail: await resolveCustomerEmail(order),",
    s,
    count=1,
)

s = re.sub(
    r"customerEmail:\s*fieldValue<string>\(order,\s*\[[^\]]+\]\),",
    "customerEmail: await resolveCustomerEmail(order),",
    s,
    count=1,
)

s = s.replace("function orderPayload(", "async function orderPayload(")

if s != original:
    path.write_text(s, encoding="utf-8")
    print("updated src/lib/notification-events.ts")
else:
    print("no changes made")

print("\\nNext:")
print("  rm -rf .next")
print("  npx prisma generate")
print("  npm run dev")
print("\\nThen test:")
print("  curl -X POST http://localhost:3000/api/notifications/events/shipping-updated -H \\"Content-Type: application/json\\" -d '{\\"orderId\\":\\"cmpwzbcpb000r7knoe4mdv2r8\\"}'")
