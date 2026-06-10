# Betsy Home MVP — Local Setup Guide

This guide helps you run the starter project on your computer.

## 1. Install the required tools

Install these first:

- Node.js LTS
- npm, included with Node.js
- VS Code or another code editor
- A PostgreSQL database, preferably Supabase for this starter

Check versions:

```bash
node -v
npm -v
```

## 2. Unzip and open the project

```bash
cd Desktop
unzip betsy-home-mvp-starter.zip
cd betsy-home-mvp-starter
code .
```

On Windows, you can also right-click the zip file, choose Extract All, then open the folder in VS Code.

## 3. Install project dependencies

```bash
npm install
```

## 4. Create your environment file

Mac/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## 5. Add the database URL

Open `.env` and replace this:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

with your real Supabase/Postgres connection string.

For the first UI preview, Stripe keys can stay empty. Payment routes will return setup errors until real keys are added.

## 6. Initialize Prisma and seed sample data

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Optional: open Prisma Studio to inspect the database.

```bash
npx prisma studio
```

## 7. Run the app

```bash
npm run dev
```

Open this in your browser:

```text
http://localhost:3000
```

## 8. Visit the first pages

Customer:

```text
/
/search
/product/handmade-ceramic-vase
/cart
/checkout
/sell
```

Seller:

```text
/seller/dashboard
/seller/listings
/seller/listings/new
/seller/shipping
/seller/product-catalogue
```

Admin:

```text
/admin/dashboard
/admin/sellers
/admin/products
/admin/orders
```

## 9. First development tasks

Start with these tasks in order:

1. Confirm the homepage runs.
2. Confirm seller and admin pages run.
3. Connect homepage product cards to Prisma data.
4. Build seller product creation form submission.
5. Save shipping profiles and excluded countries.
6. Add authentication and role-based redirects.
7. Connect Stripe Connect onboarding.
8. Build cart persistence.
9. Add checkout with shipping validation.
10. Generate seller PDF catalogues.

## 10. Common problems

### `DATABASE_URL` error

Your `.env` file is missing a valid Postgres connection string.

### Prisma migration fails

Check that your database password, host, port, and database name are correct.

### Port already in use

Run:

```bash
npm run dev -- -p 3001
```

Then open:

```text
http://localhost:3001
```

### Stripe error

Stripe keys are not required for the first UI preview. They are required only when testing payment, checkout, Connect onboarding, and webhooks.
