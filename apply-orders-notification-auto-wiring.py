#!/usr/bin/env python3
from pathlib import Path

p = Path("src/lib/orders.ts")
if not p.exists():
    raise SystemExit("Run this from the project root; src/lib/orders.ts was not found.")

s = p.read_text(encoding="utf-8")
changed = False

def patch(old, new, name):
    global s, changed
    if new in s:
        print(f"already patched: {name}")
        return
    if old not in s:
        print(f"skipped, marker not found: {name}")
        return
    s = s.replace(old, new, 1)
    changed = True
    print(f"patched: {name}")

patch(
'''import { getDemoSellerShop } from "@/lib/seller-data";
''',
'''import { getDemoSellerShop } from "@/lib/seller-data";
import {
  notifyManualRefundFollowup,
  notifyOrderCreated,
  notifyRefundResolved,
  notifyShippingUpdated,
} from "@/lib/notification-events";
''',
"imports",
)

patch(
'''function makeOrderNumber(index: number) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BH-${y}${m}${d}-${random}-${index + 1}`;
}
''',
'''function makeOrderNumber(index: number) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BH-${y}${m}${d}-${random}-${index + 1}`;
}

async function notifySafely(label: string, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    console.warn(`[notifications] ${label} failed`, error);
  }
}
''',
"notifySafely helper",
)

patch(
'''  await clearCurrentCart();

  return {
    ok: true,
''',
'''  await clearCurrentCart();

  await Promise.allSettled(
    createdOrders.map((order) => notifyOrderCreated(order.id))
  );

  return {
    ok: true,
''',
"order created",
)

patch(
'''  if (result.count === 0) {
    throw new Error("Order could not be found for this seller.");
  }
}

function optionalText(value: unknown) {
''',
'''  if (result.count === 0) {
    throw new Error("Order could not be found for this seller.");
  }

  await notifySafely("shipping status update", () => notifyShippingUpdated(orderId));
}

function optionalText(value: unknown) {
''',
"shipping status",
)

patch(
'''  if (result.count === 0) {
    throw new Error("Order could not be found for this seller.");
  }
}

export async function approveSellerRefundRequest(orderId: string, noteValue: unknown) {
''',
'''  if (result.count === 0) {
    throw new Error("Order could not be found for this seller.");
  }

  await notifySafely("tracking update", () => notifyShippingUpdated(orderId));
}

export async function approveSellerRefundRequest(orderId: string, noteValue: unknown) {
''',
"tracking update",
)

patch(
'''  return prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus,
      shippingStatus: ShippingStatus.CANCELLED,
      refundRequestStatus: RefundRequestStatus.APPROVED,
      refundResolvedAt: new Date(),
      refundResolutionNote: finalNote,
      refundStripeRefundId: stripeRefundId
    }
  });
}
''',
'''  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id
    },
    data: {
      paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus,
      shippingStatus: ShippingStatus.CANCELLED,
      refundRequestStatus: RefundRequestStatus.APPROVED,
      refundResolvedAt: new Date(),
      refundResolutionNote: finalNote,
      refundStripeRefundId: stripeRefundId
    }
  });

  await notifySafely("refund approved", () => notifyRefundResolved(updatedOrder.id));

  if (order.paymentStatus === PaymentStatus.PAID && !stripeRefundId) {
    await notifySafely("manual refund follow-up", () => notifyManualRefundFollowup(updatedOrder.id));
  }

  return updatedOrder;
}
''',
"refund approval",
)

patch(
'''  if (result.count === 0) {
    throw new Error("Refund request could not be found for this seller.");
  }
}
''',
'''  if (result.count === 0) {
    throw new Error("Refund request could not be found for this seller.");
  }

  await notifySafely("refund rejected", () => notifyRefundResolved(orderId));
}
''',
"refund rejection",
)

if changed:
    p.write_text(s, encoding="utf-8")
    print("updated src/lib/orders.ts")
else:
    print("no changes made")

print("Next: rm -rf .next && npx prisma generate && npm run dev")
