import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await sendNotification({
    kind: "order_confirmation",
    to: "customer@betsyhome.test",
    payload: {
      orderNumber: "BH-20260606-GQL59-1",
      orderTotal: "$29.00",
      shopName: "Betsy Clay Atelier",
      productTitle: "Handmade Sage Green Ceramic Candle Holder",
      actionUrl: "http://localhost:3000/account/orders",
    },
  });

  return NextResponse.json({
    ok: true,
    message:
      "Test notification logged. Check the Next.js terminal and .local-notifications/notifications.jsonl.",
    result,
  });
}
