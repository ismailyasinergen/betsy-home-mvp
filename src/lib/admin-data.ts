import { PaymentStatus, ProductStatus, ShippingStatus, ShopStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function money(value: unknown) {
  return Number(value ?? 0);
}

export async function getAdminNotificationCounts() {
  // Run these sequentially instead of with Promise.all.
  // Supabase shared pooler + local Prisma can be sensitive to many simultaneous queries.
  const pendingSellers = await prisma.shop.count({ where: { status: ShopStatus.PENDING_REVIEW } });
  const productIssues = await prisma.product.count({
    where: {
      OR: [
        { status: ProductStatus.NEEDS_REVIEW },
        { status: ProductStatus.SOLD_OUT },
        { shippingProfileId: null }
      ]
    }
  });
  const newOrders = await prisma.order.count({ where: { shippingStatus: { in: [ShippingStatus.NEW, ShippingStatus.PROCESSING] } } });
  const pendingPayments = await prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } });
  const openCustomRequests = await prisma.customOrderRequest.count({ where: { status: "OPEN" } });
  const unansweredReviews = await prisma.review.count({ where: { sellerResponse: null } });

  return {
    sellers: pendingSellers,
    products: productIssues,
    orders: newOrders,
    payments: pendingPayments,
    reports: openCustomRequests + unansweredReviews
  };
}

export async function getAdminDashboardData() {
  // Sequential queries are more stable with the Supabase shared pooler in local development.
  const users = await prisma.user.count();
  const sellers = await prisma.shop.count();
  const pendingSellers = await prisma.shop.count({ where: { status: ShopStatus.PENDING_REVIEW } });
  const productsLive = await prisma.product.count({ where: { status: ProductStatus.ACTIVE } });
  const productsNeedReview = await prisma.product.count({ where: { status: ProductStatus.NEEDS_REVIEW } });
  const orders = await prisma.order.count();
  const paidOrders = await prisma.order.count({ where: { paymentStatus: PaymentStatus.PAID } });
  const pendingPayments = await prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } });
  const openCustomRequests = await prisma.customOrderRequest.count({ where: { status: "OPEN" } });
  const unansweredReviews = await prisma.review.count({ where: { sellerResponse: null } });
  const revenue = await prisma.order.aggregate({ where: { paymentStatus: PaymentStatus.PAID }, _sum: { total: true, platformFee: true } });
  const recentOrders = await prisma.order.findMany({
    include: { shop: true, buyer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  const recentProducts = await prisma.product.findMany({
    include: { shop: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  const recentShops = await prisma.shop.findMany({
    include: { seller: true, _count: { select: { products: true, orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return {
    users,
    sellers,
    pendingSellers,
    productsLive,
    productsNeedReview,
    orders,
    paidOrders,
    pendingPayments,
    openCustomRequests,
    unansweredReviews,
    grossMerchandiseValue: money(revenue._sum.total),
    platformFees: money(revenue._sum.platformFee),
    recentOrders,
    recentProducts,
    recentShops
  };
}

export async function getAdminSellers() {
  const shops = await prisma.shop.findMany({
    include: {
      seller: true,
      _count: { select: { products: true, orders: true, reviews: true } },
      orders: {
        where: { paymentStatus: PaymentStatus.PAID },
        select: { total: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return shops.map((shop) => ({
    ...shop,
    paidRevenue: shop.orders.reduce((sum, order) => sum + Number(order.total), 0)
  }));
}

export async function getAdminProducts() {
  return prisma.product.findMany({
    include: {
      shop: true,
      category: true,
      room: true,
      style: true,
      shippingProfile: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { reviews: true, orderItems: true, favorites: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAdminOrders() {
  return prisma.order.findMany({
    include: {
      buyer: true,
      shop: true,
      items: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAdminTaxonomyData() {
  const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });
  const rooms = await prisma.room.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });
  const styles = await prisma.style.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });

  return { categories, rooms, styles };
}

export async function getAdminCollectionsData() {
  const collections = await prisma.collection.findMany({
    include: {
      products: {
        include: {
          product: {
            include: { shop: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } }
          }
        },
        orderBy: { sortOrder: "asc" }
      },
      _count: { select: { products: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const activeProducts = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    include: { shop: true },
    orderBy: { title: "asc" },
    take: 100
  });

  return { collections, activeProducts };
}

export async function getAdminPaymentsData() {
  const orders = await prisma.order.findMany({
    include: { shop: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 25
  });
  const payouts = await prisma.payout.findMany({ include: { shop: true }, orderBy: { createdAt: "desc" }, take: 25 });
  const shopsWithoutStripe = await prisma.shop.findMany({ where: { stripeAccountId: null }, orderBy: { createdAt: "desc" }, take: 25 });
  const paymentStatusCounts = await prisma.order.groupBy({ by: ["paymentStatus"], _count: { _all: true }, _sum: { total: true } });

  return { orders, payouts, shopsWithoutStripe, paymentStatusCounts };
}

export async function getAdminRefundsData() {
  const orders = await prisma.order.findMany({
    where: {
      refundRequestStatus: {
        not: "NONE"
      }
    },
    include: {
      buyer: {
        select: {
          email: true
        }
      },
      shop: {
        select: {
          shopName: true,
          seller: {
            select: {
              email: true
            }
          }
        }
      },
      items: {
        select: {
          id: true,
          quantity: true,
          titleSnapshot: true,
          priceSnapshot: true
        }
      }
    },
    orderBy: [
      {
        refundRequestedAt: "desc"
      },
      {
        createdAt: "desc"
      }
    ]
  });

  const requestedRefunds = orders.filter((order) => order.refundRequestStatus === "REQUESTED").length;
  const approvedRefunds = orders.filter((order) => order.refundRequestStatus === "APPROVED").length;
  const rejectedRefunds = orders.filter((order) => order.refundRequestStatus === "REJECTED").length;
  const manualFollowUps = orders.filter(
    (order) =>
      order.refundRequestStatus === "APPROVED" &&
      order.paymentStatus === "REFUNDED" &&
      !order.refundStripeRefundId
  ).length;

  const refundGrossValue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const refundPlatformFees = orders.reduce((sum, order) => sum + Number(order.platformFee ?? 0), 0);

  return {
    requestedRefunds,
    approvedRefunds,
    rejectedRefunds,
    manualFollowUps,
    refundGrossValue,
    refundPlatformFees,
    orders
  };
}

export async function getAdminReportsData() {
  const topShops = await prisma.shop.findMany({
    include: { orders: { where: { paymentStatus: PaymentStatus.PAID }, select: { total: true } }, _count: { select: { products: true, reviews: true } } },
    orderBy: { totalSales: "desc" },
    take: 10
  });
  const topProducts = await prisma.product.findMany({
    include: { shop: true, category: true, _count: { select: { orderItems: true, favorites: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  const lowStockProducts = await prisma.product.findMany({
    where: { quantity: { lte: 3 } },
    include: { shop: true },
    orderBy: { quantity: "asc" },
    take: 10
  });
  const openRequests = await prisma.customOrderRequest.findMany({
    where: { status: "OPEN" },
    include: { buyer: true, shop: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  const latestReviews = await prisma.review.findMany({
    include: { buyer: true, shop: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return {
    topShops: topShops.map((shop) => ({ ...shop, paidRevenue: shop.orders.reduce((sum, order) => sum + Number(order.total), 0) })),
    topProducts,
    lowStockProducts,
    openRequests,
    latestReviews
  };
}


export async function getAdminActivityData() {
  const { prisma } = await import("@/lib/prisma");
  const db = prisma as any;

  const safe = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await promise;
    } catch (error) {
      console.warn("[admin activity] safe query failed; using fallback data.");
      return fallback;
    }
  };

  const recentOrders = await safe(
    db.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        shop: true,
        items: { include: { product: true } },
      },
    }),
    []
  );

  const refundOrders = await safe(
    db.order.findMany({
      take: 8,
      where: {
        refundRequestStatus: { not: "NONE" },
      },
      orderBy: { refundRequestedAt: "desc" },
      include: {
        user: true,
        shop: { include: { owner: true } },
        items: { include: { product: true } },
      },
    }),
    []
  );

  const latestReviews = await safe(
    db.review.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        product: true,
        shop: true,
      },
    }),
    []
  );

  const messages = await safe(
    db.message.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    []
  );

  const customRequests = await safe(
    ((db.customRequest ?? db.customOrderRequest)?.findMany?.({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        shop: true,
      },
    }) ?? Promise.resolve([])),
    []
  );

  const productAlerts = await safe(
    db.product.findMany({
      take: 12,
      orderBy: { updatedAt: "desc" },
      include: {
        shop: true,
        shippingProfile: true,
      },
    }),
    []
  );

  return {
    recentOrders,

    // Names used by /admin/activity
    refundEvents: refundOrders,
    recentReviews: latestReviews,
    recentCustomRequests: customRequests,

    // Backward-compatible names
    refundOrders,
    latestReviews,
    recentMessages: messages,
    messages,
    customRequests,
    productAlerts,
  };
}
