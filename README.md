# Betsy Home MVP Starter

This is the first technical scaffold for **Betsy Home**, a curated home-products marketplace with customer, seller, and admin interfaces.

## Included

- Next.js App Router project structure
- Route groups for marketplace, seller, and admin areas
- Starter Tailwind UI
- Prisma PostgreSQL schema
- Seed data for categories, rooms, styles, shops, and products
- Shipping profiles with excluded countries
- PDF catalogue model and UI placeholder
- Stripe Connect placeholder API routes
- Marketplace checkout placeholder API route

## Recommended Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

## Environment Variables

Fill these in `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PLATFORM_FEE_PERCENT="10"
```

## Main URLs

### Customer

- `/`
- `/search`
- `/category/[slug]`
- `/room/[slug]`
- `/style/[slug]`
- `/product/[slug]`
- `/shop/[slug]`
- `/cart`
- `/checkout`
- `/account`
- `/sell`

### Seller

- `/seller/dashboard`
- `/seller/listings`
- `/seller/listings/new`
- `/seller/orders`
- `/seller/shipping`
- `/seller/product-catalogue`
- `/seller/messages`
- `/seller/payments`
- `/seller/analytics`
- `/seller/settings`

### Admin

- `/admin/dashboard`
- `/admin/sellers`
- `/admin/products`
- `/admin/orders`
- `/admin/categories`
- `/admin/collections`
- `/admin/payments`
- `/admin/reports`

## Next Build Step

The next implementation step should be connecting the pages to Prisma instead of mock data, then adding authentication and role-based redirects.
