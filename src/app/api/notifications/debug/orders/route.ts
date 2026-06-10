import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await (prisma as any).order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      count: orders.length,
      orders: orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber ?? order.number ?? order.code ?? null,
        customerId: order.customerId ?? order.buyerId ?? order.userId ?? null,
        shopId: order.shopId ?? null,
        sellerId: order.sellerId ?? null,
        customerEmail: order.customerEmail ?? order.buyerEmail ?? order.email ?? null,
        sellerEmail: order.sellerEmail ?? null,
        total: String(order.total ?? order.totalAmount ?? order.amount ?? ""),
        paymentStatus: order.paymentStatus ?? null,
        shippingStatus: order.shippingStatus ?? null,
        refundRequestStatus: order.refundRequestStatus ?? order.refundStatus ?? null,
        createdAt: order.createdAt ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
