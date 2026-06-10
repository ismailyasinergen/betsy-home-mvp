# Betsy Home MVP Route Map

## Customer Marketplace

| URL | Purpose |
|---|---|
| `/` | Marketplace homepage |
| `/search` | Search and filtered discovery |
| `/category/[slug]` | Category browsing |
| `/room/[slug]` | Room-based discovery |
| `/style/[slug]` | Style-based discovery |
| `/product/[slug]` | Product detail page |
| `/shop/[slug]` | Public seller shop |
| `/cart` | Cart grouped by seller |
| `/checkout` | Checkout and shipping validation |
| `/account` | Customer account, orders, favorites, mood boards |
| `/sell` | Seller landing page |

## Seller Studio

| URL | Purpose |
|---|---|
| `/seller/dashboard` | Seller overview and today’s tasks |
| `/seller/listings` | Listing manager |
| `/seller/listings/new` | Add product |
| `/seller/orders` | Order manager |
| `/seller/messages` | Buyer/seller messaging |
| `/seller/shipping` | Shipping profiles and excluded countries |
| `/seller/product-catalogue` | PDF catalogue generator |
| `/seller/payments` | Stripe Connect and payouts |
| `/seller/analytics` | Sales and product performance |
| `/seller/settings` | Shop settings |

## Admin

| URL | Purpose |
|---|---|
| `/admin/dashboard` | Platform overview |
| `/admin/sellers` | Seller approval and status |
| `/admin/products` | Product moderation |
| `/admin/orders` | Order monitoring |
| `/admin/categories` | Category, room, style management |
| `/admin/collections` | Homepage and SEO collections |
| `/admin/payments` | Revenue, payouts, disputes |
| `/admin/reports` | Platform reports |

## API Routes

| URL | Purpose |
|---|---|
| `/api/stripe/connect-account` | Create Stripe Express connected account onboarding link |
| `/api/checkout` | Placeholder for Stripe Connect checkout |
| `/api/webhooks/stripe` | Stripe webhook handler |
