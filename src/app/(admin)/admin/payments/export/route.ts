import { NextResponse } from "next/server";
import { PaymentStatus, RefundRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

function date(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function csvCell(value: unknown) {
  return `"${text(value).replaceAll('"', '""')}"`;
}

function buildCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
}

export async function GET() {
  const shops = await prisma.shop.findMany({
    include: {
      seller: true,
      orders: {
        where: {
          paymentStatus: {
            in: [PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED]
          }
        },
        select: {
          orderNumber: true,
          total: true,
          platformFee: true,
          paymentStatus: true,
          refundRequestStatus: true,
          refundStripeRefundId: true,
          createdAt: true
        }
      },
      _count: { select: { products: true, orders: true, reviews: true } }
    },
    orderBy: { shopName: "asc" }
  });

  const rows = shops.map((shop) => {
    const paidOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED);
    const pendingOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.PENDING);
    const refundedOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.REFUNDED || order.paymentStatus === PaymentStatus.DISPUTED);
    const manualFollowUps = shop.orders.filter(
      (order) => order.refundRequestStatus === RefundRequestStatus.APPROVED && order.paymentStatus === PaymentStatus.REFUNDED && !order.refundStripeRefundId
    );
    const paidGross = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const platformFees = paidOrders.reduce((sum, order) => sum + Number(order.platformFee), 0);
    const pendingValue = pendingOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const refundedValue = refundedOrders.reduce((sum, order) => sum + Number(order.total), 0);

    return [
      shop.shopName,
      shop.seller.email,
      shop.status,
      shop.stripeAccountId ?? "",
      shop.stripeAccountId ? "connected" : "missing",
      paidOrders.length,
      money(paidGross),
      money(platformFees),
      money(paidGross - platformFees),
      pendingOrders.length,
      money(pendingValue),
      refundedOrders.length,
      money(refundedValue),
      manualFollowUps.length,
      manualFollowUps.map((order) => order.orderNumber).join(" | "),
      shop._count.products,
      shop._count.orders,
      shop._count.reviews,
      date(new Date())
    ];
  });

  const csv = buildCsv(
    [
      "shop",
      "seller_email",
      "shop_status",
      "stripe_account_id",
      "stripe_readiness",
      "paid_orders",
      "paid_gross",
      "platform_fees",
      "seller_net_preview",
      "pending_orders",
      "pending_value",
      "refunded_or_disputed_orders",
      "refunded_or_disputed_value",
      "manual_refund_followups",
      "manual_followup_orders",
      "products",
      "total_orders",
      "reviews",
      "exported_at"
    ],
    rows
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="betsy-home-admin-payments-${stamp}.csv"`
    }
  });
}
