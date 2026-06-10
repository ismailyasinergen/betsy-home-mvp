import { PaymentStatus, ProductStatus, RefundRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  const raw = text(value);
  const escaped = raw.replaceAll('"', '""');
  return `"${escaped}"`;
}

function buildCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
}

export type AdminReportType = "orders" | "seller-payouts" | "refunds" | "products" | "platform-fees";

export const adminReportExports: { type: AdminReportType; title: string; description: string }[] = [
  {
    type: "orders",
    title: "Orders report",
    description: "All recent marketplace orders with buyer, seller, payment, shipping, and item totals."
  },
  {
    type: "seller-payouts",
    title: "Seller payout report",
    description: "Paid order value, platform fees, and seller net preview by shop."
  },
  {
    type: "refunds",
    title: "Refund/dispute report",
    description: "Refund request status, reasons, seller/admin notes, and manual follow-up references."
  },
  {
    type: "products",
    title: "Product report",
    description: "Product catalogue health, stock, status, pricing, shipping profile, and engagement counts."
  },
  {
    type: "platform-fees",
    title: "Platform fee report",
    description: "Order-level fee ledger for paid, refunded, and disputed payment statuses."
  }
];

export async function buildAdminReportCsv(type: AdminReportType) {
  if (type === "orders") {
    const orders = await prisma.order.findMany({
      include: { buyer: true, shop: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return buildCsv(
      [
        "order_number",
        "created_at",
        "buyer_email",
        "shop",
        "payment_status",
        "shipping_status",
        "subtotal",
        "shipping_total",
        "tax_total",
        "platform_fee",
        "total",
        "item_count",
        "items"
      ],
      orders.map((order) => [
        order.orderNumber,
        date(order.createdAt),
        order.buyer?.email ?? "guest",
        order.shop.shopName,
        order.paymentStatus,
        order.shippingStatus,
        money(order.subtotal),
        money(order.shippingTotal),
        money(order.taxTotal),
        money(order.platformFee),
        money(order.total),
        order.items.reduce((sum, item) => sum + item.quantity, 0),
        order.items.map((item) => `${item.quantity} x ${item.titleSnapshot}`).join(" | ")
      ])
    );
  }

  if (type === "seller-payouts") {
    const shops = await prisma.shop.findMany({
      include: {
        seller: true,
        orders: {
          where: { paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED] } },
          select: { paymentStatus: true, total: true, platformFee: true }
        },
        _count: { select: { products: true, orders: true, reviews: true } }
      },
      orderBy: { shopName: "asc" }
    });

    return buildCsv(
      [
        "shop",
        "seller_email",
        "stripe_account_id",
        "status",
        "paid_orders",
        "refunded_or_disputed_orders",
        "paid_gross",
        "platform_fees",
        "seller_net_preview",
        "products",
        "reviews",
        "total_orders"
      ],
      shops.map((shop) => {
        const paidOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED);
        const refundedOrders = shop.orders.filter((order) => order.paymentStatus === PaymentStatus.REFUNDED || order.paymentStatus === PaymentStatus.DISPUTED);
        const paidGross = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const fees = paidOrders.reduce((sum, order) => sum + Number(order.platformFee), 0);
        return [
          shop.shopName,
          shop.seller.email,
          shop.stripeAccountId ?? "",
          shop.status,
          paidOrders.length,
          refundedOrders.length,
          money(paidGross),
          money(fees),
          money(paidGross - fees),
          shop._count.products,
          shop._count.reviews,
          shop._count.orders
        ];
      })
    );
  }

  if (type === "refunds") {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { refundRequestStatus: { not: RefundRequestStatus.NONE } },
          { paymentStatus: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED] } }
        ]
      },
      include: { buyer: true, shop: { include: { seller: true } }, items: true },
      orderBy: [{ refundRequestedAt: "desc" }, { updatedAt: "desc" }],
      take: 500
    });

    return buildCsv(
      [
        "order_number",
        "shop",
        "seller_email",
        "buyer_email",
        "refund_status",
        "payment_status",
        "shipping_status",
        "requested_at",
        "resolved_at",
        "total",
        "platform_fee",
        "customer_reason",
        "resolution_note",
        "stripe_or_manual_refund_reference"
      ],
      orders.map((order) => [
        order.orderNumber,
        order.shop.shopName,
        order.shop.seller.email,
        order.buyer?.email ?? "guest",
        order.refundRequestStatus ?? "NONE",
        order.paymentStatus,
        order.shippingStatus,
        date(order.refundRequestedAt),
        date(order.refundResolvedAt),
        money(order.total),
        money(order.platformFee),
        order.refundReason ?? "",
        order.refundResolutionNote ?? "",
        order.refundStripeRefundId ?? ""
      ])
    );
  }

  if (type === "products") {
    const products = await prisma.product.findMany({
      include: {
        shop: true,
        category: true,
        room: true,
        style: true,
        shippingProfile: true,
        _count: { select: { orderItems: true, favorites: true, reviews: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return buildCsv(
      [
        "product",
        "shop",
        "status",
        "price",
        "sale_price",
        "quantity",
        "sku",
        "category",
        "room",
        "style",
        "shipping_profile",
        "sold_item_rows",
        "favorites",
        "reviews",
        "created_at"
      ],
      products.map((product) => [
        product.title,
        product.shop.shopName,
        product.status,
        money(product.price),
        product.salePrice === null ? "" : money(product.salePrice),
        product.quantity,
        product.sku ?? "",
        product.category.name,
        product.room?.name ?? "",
        product.style?.name ?? "",
        product.shippingProfile?.profileName ?? "MISSING",
        product._count.orderItems,
        product._count.favorites,
        product._count.reviews,
        date(product.createdAt)
      ])
    );
  }

  if (type === "platform-fees") {
    const orders = await prisma.order.findMany({
      where: { paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.DISPUTED] } },
      include: { buyer: true, shop: true },
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return buildCsv(
      [
        "order_number",
        "created_at",
        "shop",
        "buyer_email",
        "payment_status",
        "gross_total",
        "platform_fee",
        "seller_net_preview"
      ],
      orders.map((order) => [
        order.orderNumber,
        date(order.createdAt),
        order.shop.shopName,
        order.buyer?.email ?? "guest",
        order.paymentStatus,
        money(order.total),
        money(order.platformFee),
        money(Number(order.total) - Number(order.platformFee))
      ])
    );
  }

  throw new Error("Unsupported report type.");
}
