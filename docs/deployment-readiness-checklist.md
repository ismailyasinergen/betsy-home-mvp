# Betsy Home deployment readiness checklist

Use this before deploying the MVP to staging or production.

## 1. Environment variables

Required before production:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DEMO_SELLER_FALLBACKS_ENABLED=false`

Recommended:

- `NEXT_PUBLIC_APP_URL`
- `DEMO_ACCOUNTS_ENABLED=false`

## 2. Database

Use Supabase transaction pooler for deployed/serverless apps:

```text
host: aws-1-us-east-1.pooler.supabase.com
port: 6543
params: pgbouncer=true&connection_limit=5&pool_timeout=60&sslmode=require
```

Before deployment:

- Confirm `/api/health` returns database OK.
- Confirm `/admin/health` shows Database connection OK.
- Avoid `npx prisma db pull` unless schema changed.
- Run real schema migrations through Supabase SQL Editor or Prisma migration workflow, not random local introspection.

## 3. Stripe

For staging:

- Use Stripe test mode keys.
- Configure Stripe webhook endpoint:
  - `https://your-staging-domain.com/api/webhooks/stripe`
- Add the webhook secret to `STRIPE_WEBHOOK_SECRET`.
- Test:
  - Checkout success
  - Webhook payment confirmation
  - Stripe Connect seller onboarding
  - Refund follow-up flow

For production:

- Replace test keys with live keys only after final testing.
- Use a live webhook endpoint.
- Confirm Connect account onboarding flow uses live mode.
- Keep manual refund follow-up visible for admin.

## 4. Auth and ownership

Before real users:

- No hardcoded seller fallback should run in production.
- Seller pages must only show shops/orders/products owned by the signed-in seller.
- Admin-only pages must redirect non-admin users.
- Customer pages must only show the signed-in customer's own orders.
- Demo quick-login should be disabled or isolated from production.

## 5. Smoke test after deployment

Run these paths:

```text
/
/login
/search
/product/...
/cart
/checkout/success
/account/orders
/seller/dashboard
/seller/orders
/seller/payments
/seller/analytics
/admin/dashboard
/admin/activity
/admin/payments
/admin/refunds
/admin/reports
/admin/health
/api/health
/api/readiness
```

## 6. Launch blocker list

Do not launch if any of these are true:

- `/api/health` database check fails.
- Seller fallback ownership is enabled.
- Stripe webhook secret is missing.
- Checkout creates unpaid or duplicate orders incorrectly.
- Sellers can see other sellers' orders/products.
- Customers can see other customers' orders.
- Admin pages are accessible to seller/customer users.
