import { MessageStatus } from "@prisma/client";
import { getDemoCustomer } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { getDemoSellerShop } from "@/lib/seller-data";

async function getRawCustomerMessages(customerId: string) {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: customerId },
        { receiverId: customerId }
      ],
      shopId: {
        not: null
      }
    },
    include: {
      sender: true,
      receiver: true,
      shop: true,
      order: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

type MessageWithRelations = Awaited<ReturnType<typeof getRawCustomerMessages>>[number];

function getPreview(text: string) {
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

export async function getCustomerMessageConversations() {
  const customer = await getDemoCustomer();
  const messages = await getRawCustomerMessages(customer.id);
  const grouped = new Map<string, MessageWithRelations[]>();

  for (const message of messages) {
    if (!message.shopId) {
      continue;
    }

    const existing = grouped.get(message.shopId);
    if (existing) {
      existing.push(message);
    } else {
      grouped.set(message.shopId, [message]);
    }
  }

  const conversations = Array.from(grouped.entries()).map(([shopId, items]) => {
    const latest = items[0];
    const unreadCount = items.filter((item) => item.receiverId === customer.id && item.status === MessageStatus.UNREAD).length;

    return {
      shopId,
      shopName: latest.shop?.shopName ?? "Seller shop",
      shopSlug: latest.shop?.shopSlug ?? "",
      latestMessage: getPreview(latest.message),
      latestAt: latest.createdAt,
      unreadCount,
      messageCount: items.length
    };
  });

  return {
    customer,
    conversations
  };
}

export async function getCustomerConversation(shopId: string) {
  const customer = await getDemoCustomer();
  const shop = await prisma.shop.findUnique({
    where: {
      id: shopId
    },
    include: {
      seller: true
    }
  });

  if (!shop) {
    return {
      customer,
      shop: null,
      messages: []
    };
  }

  await prisma.message.updateMany({
    where: {
      shopId,
      receiverId: customer.id,
      status: MessageStatus.UNREAD
    },
    data: {
      status: MessageStatus.READ
    }
  });

  const messages = await prisma.message.findMany({
    where: {
      shopId,
      OR: [
        {
          senderId: customer.id,
          receiverId: (shop as any).sellerId
        },
        {
          senderId: (shop as any).sellerId,
          receiverId: customer.id
        }
      ]
    },
    include: {
      sender: true,
      receiver: true,
      order: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return {
    customer,
    shop,
    messages
  };
}

async function getRawSellerMessages(shopId: string, sellerId: string) {
  return prisma.message.findMany({
    where: {
      shopId,
      OR: [
        { senderId: sellerId },
        { receiverId: sellerId }
      ]
    },
    include: {
      sender: true,
      receiver: true,
      order: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

type SellerMessageWithRelations = Awaited<ReturnType<typeof getRawSellerMessages>>[number];

export async function getSellerMessageConversations() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      conversations: []
    };
  }

  const messages = await getRawSellerMessages((shop as any).id, (shop as any).sellerId);
  const grouped = new Map<string, SellerMessageWithRelations[]>();

  for (const message of messages) {
    const customerId = message.senderId === (shop as any).sellerId ? message.receiverId : message.senderId;
    const existing = grouped.get(customerId);
    if (existing) {
      existing.push(message);
    } else {
      grouped.set(customerId, [message]);
    }
  }

  const conversations = Array.from(grouped.entries()).map(([customerId, items]) => {
    const latest = items[0];
    const customer = latest.senderId === (shop as any).sellerId ? latest.receiver : latest.sender;
    const unreadCount = items.filter((item) => item.receiverId === (shop as any).sellerId && item.status === MessageStatus.UNREAD).length;

    return {
      customerId,
      customerName: customer.name ?? customer.email,
      customerEmail: customer.email,
      latestMessage: getPreview(latest.message),
      latestAt: latest.createdAt,
      unreadCount,
      messageCount: items.length
    };
  });

  return {
    shop,
    conversations
  };
}

export async function getSellerConversation(customerId: string) {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return {
      shop: null,
      customer: null,
      messages: []
    };
  }

  const customer = await prisma.user.findUnique({
    where: {
      id: customerId
    }
  });

  if (!customer) {
    return {
      shop,
      customer: null,
      messages: []
    };
  }

  await prisma.message.updateMany({
    where: {
      shopId: (shop as any).id,
      receiverId: (shop as any).sellerId,
      senderId: customerId,
      status: MessageStatus.UNREAD
    },
    data: {
      status: MessageStatus.READ
    }
  });

  const messages = await prisma.message.findMany({
    where: {
      shopId: (shop as any).id,
      OR: [
        {
          senderId: (shop as any).sellerId,
          receiverId: customerId
        },
        {
          senderId: customerId,
          receiverId: (shop as any).sellerId
        }
      ]
    },
    include: {
      sender: true,
      receiver: true,
      order: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return {
    shop,
    customer,
    messages
  };
}

export async function getCustomerMessageCount() {
  const customer = await getDemoCustomer();

  return prisma.message.count({
    where: {
      OR: [
        { senderId: customer.id },
        { receiverId: customer.id }
      ]
    }
  });
}

export async function getCustomerUnreadMessageCount() {
  const customer = await getDemoCustomer();

  return prisma.message.count({
    where: {
      receiverId: customer.id,
      status: MessageStatus.UNREAD
    }
  });
}

export async function getSellerUnreadMessageCount() {
  const shop = await getDemoSellerShop();

  if (!shop) {
    return 0;
  }

  return prisma.message.count({
    where: {
      shopId: (shop as any).id,
      receiverId: (shop as any).sellerId,
      status: MessageStatus.UNREAD
    }
  });
}
