# Notification email resolver hardening

This patch makes `src/lib/notification-events.ts` resolve customer and seller emails from scalar IDs instead of relying only on Prisma relation includes.

It checks fields like:

- `customerEmail`
- `buyerEmail`
- `customerId`
- `buyerId`
- `userId`
- `shopId`
- `shop.sellerId`
- `shop.ownerId`
- `shop.userId`
- `shop.email`
- `shop.sellerEmail`

Then it returns a `resolved` object in event endpoint responses so you can see which emails were found.

## Test

```bash
curl -X POST http://localhost:3000/api/notifications/events/order-created -H "Content-Type: application/json" -d '{"orderId":"cmq1ziigx00037k5k07m50nhq"}'
```

Expected response should include `notifications: 1` or `notifications: 2`, depending on whether both customer and seller email were resolved.
