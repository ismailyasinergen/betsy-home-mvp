import type { Prisma } from "@prisma/client";
import { getCurrentCustomerOrNull, getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/lib/marketplace-data";

const boardProductInclude = {
  product: {
    include: {
      shop: true,
      category: true,
      room: true,
      style: true,
      shippingProfile: true,
      images: {
        orderBy: {
          sortOrder: "asc" as const
        },
        take: 1
      },
      _count: {
        select: {
          reviews: true
        }
      }
    }
  }
};

const boardDetailInclude = {
  user: true,
  items: {
    include: boardProductInclude,
    orderBy: {
      createdAt: "desc" as const
    }
  },
  _count: {
    select: {
      items: true
    }
  }
};

type BoardItemWithProduct = Prisma.MoodBoardItemGetPayload<{
  include: typeof boardProductInclude;
}>;

type BoardWithDetails = Prisma.MoodBoardGetPayload<{
  include: typeof boardDetailInclude;
}>;

function mapBoardProduct(item: BoardItemWithProduct): ProductCardData & { addedAt: Date } {
  const product = item.product as any;

  return {
    id: product.id,
      shopId: product.shopId ?? product.shop?.id ?? "",
    title: product.title,
    slug: product.slug,
    price: Number(product.salePrice ?? product.price),
    rating: product.shop.rating,
    reviewCount: product._count.reviews || product.shop.totalSales,
    shopName: product.shop.shopName,
    shopSlug: product.shop.shopSlug,
    imageUrl:
      product.images[0]?.imageUrl ??
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
    category: product.category.name,
    categorySlug: product.category.slug,
    room: product.room?.name ?? "Home",
    roomSlug: product.room?.slug ?? null,
    style: product.style?.name ?? "Handmade",
    styleSlug: product.style?.slug ?? null,
    shippingNote: product.shippingProfile?.estimatedDeliveryText ?? "Shipping profile will be added by the seller",
    customizable: product.isCustomizable,
    addedAt: item.createdAt
  };
}

function mapBoard(board: BoardWithDetails) {
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    isPublic: board.isPublic,
    ownerName: board.user.name ?? board.user.email,
    ownerEmail: board.user.email,
    itemCount: board._count.items,
    products: board.items.map(mapBoardProduct),
    previewImages: board.items.slice(0, 4).map((item) => item.product.images[0]?.imageUrl).filter(Boolean) as string[],
    createdAt: board.createdAt,
    updatedAt: board.updatedAt
  };
}

export async function getCustomerMoodBoards() {
  const customer = await getDemoCustomer();

  const boards = await prisma.moodBoard.findMany({
    where: {
      userId: customer.id
    },
    include: boardDetailInclude,
    orderBy: {
      updatedAt: "desc"
    }
  });

  return {
    customer,
    boards: boards.map(mapBoard)
  };
}

export async function getCustomerMoodBoardById(boardId: string) {
  const customer = await getDemoCustomer();

  const board = await prisma.moodBoard.findFirst({
    where: {
      id: boardId,
      userId: customer.id
    },
    include: boardDetailInclude
  });

  if (!board) {
    return null;
  }

  return {
    customer,
    board: mapBoard(board)
  };
}

export async function getCustomerMoodBoardOptions(productId?: string) {
  const customer = await getCurrentCustomerOrNull();

  if (!customer) {
    return [];
  }

  const boards = await prisma.moodBoard.findMany({
    where: {
      userId: customer.id
    },
    include: {
      items: {
        where: productId
          ? {
              productId
            }
          : {
              productId: "__no_product_selected__"
            },
        select: {
          id: true
        }
      },
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return boards.map((board) => ({
    id: board.id,
    title: board.title,
    isPublic: board.isPublic,
    itemCount: board._count.items,
    hasProduct: productId ? board.items.length > 0 : false
  }));
}

export async function getCustomerMoodBoardCount() {
  const customer = await getDemoCustomer();

  return prisma.moodBoard.count({
    where: {
      userId: customer.id
    }
  });
}

export async function getPublicMoodBoards() {
  const boards = await prisma.moodBoard.findMany({
    where: {
      isPublic: true
    },
    include: boardDetailInclude,
    orderBy: {
      updatedAt: "desc"
    }
  });

  return boards.map(mapBoard);
}

export async function getPublicMoodBoardById(boardId: string) {
  const board = await prisma.moodBoard.findFirst({
    where: {
      id: boardId,
      isPublic: true
    },
    include: boardDetailInclude
  });

  if (!board) {
    return null;
  }

  return mapBoard(board);
}

export async function createMoodBoard(input: { title: string; description?: string; isPublic: boolean }) {
  const customer = await getDemoCustomer();

  return prisma.moodBoard.create({
    data: {
      userId: customer.id,
      title: input.title,
      description: input.description || null,
      isPublic: input.isPublic
    }
  });
}

export async function addProductToMoodBoard(input: { boardId: string; productId: string }) {
  const customer = await getDemoCustomer();

  const [board, product] = await Promise.all([
    prisma.moodBoard.findFirst({
      where: {
        id: input.boardId,
        userId: customer.id
      },
      select: {
        id: true
      }
    }),
    prisma.product.findUnique({
      where: {
        id: input.productId
      },
      select: {
        id: true
      }
    })
  ]);

  if (!board) {
    throw new Error("Mood board could not be found.");
  }

  if (!product) {
    throw new Error("Product could not be found.");
  }

  await prisma.moodBoardItem.upsert({
    where: {
      boardId_productId: {
        boardId: input.boardId,
        productId: input.productId
      }
    },
    update: {},
    create: {
      boardId: input.boardId,
      productId: input.productId
    }
  });

  await prisma.moodBoard.update({
    where: {
      id: input.boardId
    },
    data: {
      updatedAt: new Date()
    }
  });
}

export async function removeProductFromMoodBoard(input: { boardId: string; productId: string }) {
  const customer = await getDemoCustomer();

  const board = await prisma.moodBoard.findFirst({
    where: {
      id: input.boardId,
      userId: customer.id
    },
    select: {
      id: true
    }
  });

  if (!board) {
    throw new Error("Mood board could not be found.");
  }

  await prisma.moodBoardItem.deleteMany({
    where: {
      boardId: input.boardId,
      productId: input.productId
    }
  });

  await prisma.moodBoard.update({
    where: {
      id: input.boardId
    },
    data: {
      updatedAt: new Date()
    }
  });
}

export async function setMoodBoardPublicStatus(input: { boardId: string; isPublic: boolean }) {
  const customer = await getDemoCustomer();

  return prisma.moodBoard.updateMany({
    where: {
      id: input.boardId,
      userId: customer.id
    },
    data: {
      isPublic: input.isPublic
    }
  });
}

export async function deleteMoodBoard(boardId: string) {
  const customer = await getDemoCustomer();

  await prisma.moodBoard.deleteMany({
    where: {
      id: boardId,
      userId: customer.id
    }
  });
}
