import { PaymentStatus } from "@prisma/client";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

export async function getCustomerReviewCenterData() {
  const customer = await getDemoCustomer();

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: PaymentStatus.PAID,
      OR: [
        { buyerId: customer.id },
        // Older demo orders were created before the demo customer was attached.
        { buyerId: null }
      ]
    },
    include: {
      shop: true,
      reviews: {
        where: {
          buyerId: customer.id
        }
      },
      items: {
        include: {
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
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const reviewableItems = orders.flatMap((order) =>
    order.items
      .filter((item) => item.productId && item.product)
      .map((item) => {
        const existingReview = order.reviews.find((review) => review.productId === item.productId);

        return {
          order,
          item,
          product: item.product!,
          existingReview
        };
      })
  );

  const submittedReviews = await prisma.review.findMany({
    where: {
      buyerId: customer.id
    },
    include: {
      product: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc"
            },
            take: 1
          }
        }
      },
      shop: true,
      order: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    customer,
    reviewableItems,
    submittedReviews
  };
}

export async function getSellerReviewsData() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      reviews: [],
      averageRating: 0,
      unansweredCount: 0
    };
  }

  const reviews = await prisma.review.findMany({
    where: {
      shopId: shop.id
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
      },
      order: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    shop,
    reviews,
    averageRating: average(reviews.map((review) => review.rating)),
    unansweredCount: reviews.filter((review) => !review.sellerResponse).length
  };
}

export async function getSellerUnansweredReviewCount() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return 0;
  }

  return prisma.review.count({
    where: {
      shopId: shop.id,
      sellerResponse: null
    }
  });
}
