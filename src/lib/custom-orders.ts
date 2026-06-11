import { CustomOrderStatus } from "@prisma/client";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

export type CustomOrderRequestStatus = CustomOrderStatus;

export function money(value: unknown) {
  const amount = Number(value ?? 0);
  return `$${amount.toFixed(2)}`;
}

export function formatCustomOrderDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function getCustomOrderStatusLabel(status: CustomOrderStatus) {
  const labels: Record<CustomOrderStatus, string> = {
    OPEN: "Open",
    QUOTED: "Quoted",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    CLOSED: "Closed"
  };

  return labels[status];
}

export function getCustomOrderStatusClass(status: CustomOrderStatus) {
  const classes: Record<CustomOrderStatus, string> = {
    OPEN: "bg-blue-50 text-blue-700",
    QUOTED: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-sage/10 text-sage",
    DECLINED: "bg-red-50 text-red-700",
    CLOSED: "bg-charcoal/10 text-charcoal/70"
  };

  return classes[status];
}

export async function getCustomerCustomOrders() {
  const customer = await getDemoCustomer();

  const requests = await prisma.customOrderRequest.findMany({
    where: {
      buyerId: customer.id
    },
    include: {
      shop: true,
      product: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc"
            },
            take: 1
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    customer,
    requests
  };
}

export async function getCustomerCustomOrderById(id: string) {
  const customer = await getDemoCustomer();

  return prisma.customOrderRequest.findFirst({
    where: {
      id,
      buyerId: customer.id
    },
    include: {
      shop: true,
      product: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc"
            },
            take: 1
          }
        }
      }
    }
  });
}

export async function getCustomerCustomOrderCount() {
  const customer = await getDemoCustomer();

  return prisma.customOrderRequest.count({
    where: {
      buyerId: customer.id
    }
  });
}

export async function getSellerCustomRequests() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      requests: [],
      counts: {
        total: 0,
        open: 0,
        quoted: 0,
        accepted: 0
      }
    };
  }

  const [requests, total, open, quoted, accepted] = await Promise.all([
    prisma.customOrderRequest.findMany({
      where: {
        shopId: (shop as any).id
      },
      include: {
        buyer: true,
        product: {
          include: {
            images: {
              orderBy: {
                sortOrder: "asc"
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.customOrderRequest.count({ where: { shopId: (shop as any).id } }),
    prisma.customOrderRequest.count({ where: { shopId: (shop as any).id, status: CustomOrderStatus.OPEN } }),
    prisma.customOrderRequest.count({ where: { shopId: (shop as any).id, status: CustomOrderStatus.QUOTED } }),
    prisma.customOrderRequest.count({ where: { shopId: (shop as any).id, status: CustomOrderStatus.ACCEPTED } })
  ]);

  return {
    shop,
    requests,
    counts: {
      total,
      open,
      quoted,
      accepted
    }
  };
}

export async function getSellerCustomRequestById(id: string) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      request: null
    };
  }

  const request = await prisma.customOrderRequest.findFirst({
    where: {
      id,
      shopId: (shop as any).id
    },
    include: {
      buyer: true,
      product: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc"
            },
            take: 1
          }
        }
      }
    }
  });

  return {
    shop,
    request
  };
}
