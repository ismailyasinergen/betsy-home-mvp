-- Add seller fulfillment tracking fields to orders.
ALTER TABLE "Order" ADD COLUMN "trackingCarrier" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingNote" TEXT;
