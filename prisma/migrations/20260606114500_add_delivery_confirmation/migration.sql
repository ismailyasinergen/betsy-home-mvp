-- Add customer delivery confirmation fields to orders.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerConfirmedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerDeliveryNote" TEXT;
