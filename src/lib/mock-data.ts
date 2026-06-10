export type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  rating: number;
  reviewCount: number;
  shopName: string;
  shopSlug: string;
  imageUrl: string;
  category: string;
  room: string;
  style: string;
  shippingNote: string;
  customizable?: boolean;
};

export const categories = [
  { name: "Wall Art", slug: "wall-art" },
  { name: "Ceramics", slug: "ceramics" },
  { name: "Candles", slug: "candles" },
  { name: "Rugs", slug: "rugs" },
  { name: "Kitchen & Dining", slug: "kitchen-and-dining" },
  { name: "Furniture", slug: "furniture" }
];

export const rooms = [
  { name: "Living Room", slug: "living-room" },
  { name: "Bedroom", slug: "bedroom" },
  { name: "Kitchen", slug: "kitchen" },
  { name: "Bathroom", slug: "bathroom" },
  { name: "Home Office", slug: "home-office" },
  { name: "Garden & Balcony", slug: "garden-and-balcony" }
];

export const styles = [
  { name: "Minimalist", slug: "minimalist" },
  { name: "Boho", slug: "boho" },
  { name: "Scandinavian", slug: "scandinavian" },
  { name: "Mediterranean", slug: "mediterranean" },
  { name: "Rustic", slug: "rustic" },
  { name: "Luxury", slug: "luxury" }
];

export const products: Product[] = [
  {
    id: "p1",
    title: "Handmade Ceramic Vase",
    slug: "handmade-ceramic-vase",
    price: 38,
    rating: 4.9,
    reviewCount: 124,
    shopName: "Luna Clay Studio",
    shopSlug: "luna-clay-studio",
    imageUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=1200&auto=format&fit=crop",
    category: "Ceramics",
    room: "Living Room",
    style: "Minimalist",
    shippingNote: "Ships in 3–5 days",
    customizable: true
  },
  {
    id: "p2",
    title: "Botanical Wall Print Set",
    slug: "botanical-wall-print-set",
    price: 24,
    rating: 4.8,
    reviewCount: 88,
    shopName: "Paper Garden Co.",
    shopSlug: "paper-garden-co",
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
    category: "Wall Art",
    room: "Bedroom",
    style: "Boho",
    shippingNote: "Free shipping"
  },
  {
    id: "p3",
    title: "Olive Grove Soy Candle",
    slug: "olive-grove-soy-candle",
    price: 18,
    rating: 4.7,
    reviewCount: 56,
    shopName: "Aegean Flame",
    shopSlug: "aegean-flame",
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1200&auto=format&fit=crop",
    category: "Candles",
    room: "Kitchen",
    style: "Mediterranean",
    shippingNote: "Ships internationally"
  },
  {
    id: "p4",
    title: "Woven Cotton Throw Blanket",
    slug: "woven-cotton-throw-blanket",
    price: 62,
    rating: 4.9,
    reviewCount: 147,
    shopName: "Soft Loom Home",
    shopSlug: "soft-loom-home",
    imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop",
    category: "Textiles",
    room: "Living Room",
    style: "Scandinavian",
    shippingNote: "Ships in 2–4 days"
  }
];

export const sellerTasks = [
  "Connect Stripe to receive payouts",
  "Add a shipping profile to 3 listings",
  "Reply to 2 customer messages",
  "Create your first PDF catalogue",
  "Add dimensions to 5 products"
];
