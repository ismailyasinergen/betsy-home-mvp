# Start Here

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Add your Supabase/Postgres database URL and Stripe keys.

## 3. Initialize Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

## 4. Start the app

```bash
npm run dev
```

Open: `http://localhost:3000`

## 5. First code connection tasks

1. Replace mock product data with Prisma queries.
2. Add authentication.
3. Add role-based access control.
4. Save seller onboarding data to database.
5. Save products from `/seller/listings/new`.
6. Connect Stripe Connect onboarding to real shop records.
7. Build real cart and checkout.
8. Add shipping country validation during cart and checkout.
9. Implement PDF catalogue generation.
