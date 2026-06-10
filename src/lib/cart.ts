import { cookies } from "next/headers";
import { ProductStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CART_COOKIE_NAME = "betsy_cart_session";

export type CartCountryOption = {
  code: string;
  name: string;
};

export const CHECKOUT_COUNTRIES: CartCountryOption[] = [
  { code: "DE", name: "Germany" },
  { code: "US", name: "United States" },
  { code: "TR", name: "Türkiye" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "RU", name: "Russia" },
  { code: "BY", name: "Belarus" },
  { code: "IR", name: "Iran" },
  { code: "SY", name: "Syria" },
  { code: "KP", name: "North Korea" }
];

const cartItemInclude = {
  product: {
    include: {
      shop: true,
      category: true,
      images: {
        orderBy: {
          sortOrder: "asc" as const
        }
      },
      shippingProfile: {
        include: {
          excludedCountries: {
            orderBy: {
              countryName: "asc" as const
            }
          }
        }
      }
    }
  }
};

function normalizeCountryCode(countryCode?: string) {
  const value = countryCode?.trim().toUpperCase();
  return value && CHECKOUT_COUNTRIES.some((country) => country.code === value) ? value : "DE";
}

function getCountryName(countryCode: string) {
  return CHECKOUT_COUNTRIES.find((country) => country.code === countryCode)?.name ?? countryCode;
}

async function getCurrentCustomerId() {
  const currentUser = await getCurrentUser();
  return currentUser?.role === UserRole.CUSTOMER ? currentUser.id : null;
}

async function getCartSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = crypto.randomUUID();
  cookieStore.set(CART_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return sessionId;
}

async function getCartOwner(createSession = false) {
  const customerId = await getCurrentCustomerId();

  if (customerId) {
    return {
      userId: customerId,
      sessionId: createSession ? await getOrCreateCartSessionId() : await getCartSessionId()
    };
  }

  const sessionId = createSession ? await getOrCreateCartSessionId() : await getCartSessionId();

  return {
    userId: null,
    sessionId
  };
}

async function getOrCreateCart() {
  const owner = await getCartOwner(true);

  if (owner.userId) {
    const existingUserCart = await prisma.cart.findFirst({
      where: {
        userId: owner.userId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (existingUserCart) {
      return existingUserCart;
    }

    if (owner.sessionId) {
      const existingSessionCart = await prisma.cart.findFirst({
        where: {
          sessionId: owner.sessionId,
          userId: null
        }
      });

      if (existingSessionCart) {
        return prisma.cart.update({
          where: {
            id: existingSessionCart.id
          },
          data: {
            userId: owner.userId
          }
        });
      }
    }

    return prisma.cart.create({
      data: {
        userId: owner.userId,
        sessionId: owner.sessionId
      }
    });
  }

  if (!owner.sessionId) {
    throw new Error("Cart session could not be created.");
  }

  const existingCart = await prisma.cart.findFirst({
    where: {
      sessionId: owner.sessionId
    }
  });

  if (existingCart) {
    return existingCart;
  }

  return prisma.cart.create({
    data: {
      sessionId: owner.sessionId
    }
  });
}

function getOwnedCartItemWhere(itemId: string, owner: Awaited<ReturnType<typeof getCartOwner>>) {
  if (owner.userId) {
    return {
      id: itemId,
      cart: {
        userId: owner.userId
      }
    };
  }

  if (owner.sessionId) {
    return {
      id: itemId,
      cart: {
        sessionId: owner.sessionId
      }
    };
  }

  return null;
}

function getOwnedCartWhere(owner: Awaited<ReturnType<typeof getCartOwner>>) {
  if (owner.userId) {
    return {
      userId: owner.userId
    };
  }

  if (owner.sessionId) {
    return {
      sessionId: owner.sessionId
    };
  }

  return null;
}

export async function addProductToCart(productId: string, personalizationText?: string) {
  const cart = await getOrCreateCart();

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: ProductStatus.ACTIVE
    },
    select: {
      id: true
    }
  });

  if (!product) {
    throw new Error("Product is not available.");
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId
    }
  });

  if (existingItem) {
    return prisma.cartItem.update({
      where: {
        id: existingItem.id
      },
      data: {
        quantity: existingItem.quantity + 1,
        personalizationText: personalizationText?.trim() || existingItem.personalizationText
      }
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity: 1,
      personalizationText: personalizationText?.trim() || null
    }
  });
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const owner = await getCartOwner();
  const where = getOwnedCartItemWhere(itemId, owner);

  if (!where) {
    return null;
  }

  const safeQuantity = Math.max(1, Math.min(99, quantity));

  return prisma.cartItem.updateMany({
    where,
    data: {
      quantity: safeQuantity
    }
  });
}

export async function removeCartItem(itemId: string) {
  const owner = await getCartOwner();
  const where = getOwnedCartItemWhere(itemId, owner);

  if (!where) {
    return null;
  }

  return prisma.cartItem.deleteMany({
    where
  });
}

export async function clearCurrentCart() {
  const owner = await getCartOwner();
  const where = getOwnedCartWhere(owner);

  if (!where) {
    return null;
  }

  return prisma.cartItem.deleteMany({
    where: {
      cart: where
    }
  });
}

export async function getCartPageData(countryCode?: string) {
  const owner = await getCartOwner();
  const selectedCountryCode = normalizeCountryCode(countryCode);
  const selectedCountryName = getCountryName(selectedCountryCode);

  const cartWhere = getOwnedCartWhere(owner);

  if (!cartWhere) {
    return {
      selectedCountryCode,
      selectedCountryName,
      countries: CHECKOUT_COUNTRIES,
      groups: [],
      items: [],
      subtotal: 0,
      shippingTotal: 0,
      estimatedTax: 0,
      total: 0,
      blockedItems: [],
      canCheckout: false
    };
  }

  const cart = await prisma.cart.findFirst({
    where: cartWhere,
    include: {
      items: {
        include: cartItemInclude,
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const rawItems = cart?.items ?? [];

  const items = rawItems.map((item) => {
    const price = Number(item.product.salePrice ?? item.product.price);
    const lineTotal = price * item.quantity;
    const excludedCountries = item.product.shippingProfile?.excludedCountries ?? [];
    const isBlocked = excludedCountries.some((country) => country.countryCode.toUpperCase() === selectedCountryCode);

    return {
      id: item.id,
      quantity: item.quantity,
      personalizationText: item.personalizationText,
      price,
      lineTotal,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        imageUrl: item.product.images[0]?.imageUrl ?? "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
        categoryName: item.product.category.name,
        stock: item.product.quantity,
        shopId: item.product.shop.id,
        shopName: item.product.shop.shopName,
        shopSlug: item.product.shop.shopSlug,
        shippingNote: item.product.shippingProfile?.estimatedDeliveryText ?? "Shipping will be confirmed by the seller",
        excludedCountries: excludedCountries.map((country) => ({
          countryCode: country.countryCode,
          countryName: country.countryName
        }))
      },
      isBlocked,
      blockMessage: isBlocked
        ? `This item cannot be shipped to ${selectedCountryName}.`
        : `Ships to ${selectedCountryName}.`
    };
  });

  const groupsMap = new Map<string, {
    shopId: string;
    shopName: string;
    shopSlug: string;
    items: typeof items;
    subtotal: number;
  }>();

  for (const item of items) {
    const key = item.product.shopId;
    const existing = groupsMap.get(key);

    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.lineTotal;
    } else {
      groupsMap.set(key, {
        shopId: item.product.shopId,
        shopName: item.product.shopName,
        shopSlug: item.product.shopSlug,
        items: [item],
        subtotal: item.lineTotal
      });
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingTotal = items.length > 0 ? 0 : 0;
  const estimatedTax = 0;
  const total = subtotal + shippingTotal + estimatedTax;
  const blockedItems = items.filter((item) => item.isBlocked);

  return {
    selectedCountryCode,
    selectedCountryName,
    countries: CHECKOUT_COUNTRIES,
    groups: Array.from(groupsMap.values()),
    items,
    subtotal,
    shippingTotal,
    estimatedTax,
    total,
    blockedItems,
    canCheckout: items.length > 0 && blockedItems.length === 0
  };
}
