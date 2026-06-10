# Betsy Home notification event wiring

This patch connects the local-safe notification service to marketplace events through reusable event helpers and API endpoints.

## What it adds

- `src/lib/notification-events.ts`
- `/api/notifications/events/order-created`
- `/api/notifications/events/shipping-updated`
- `/api/notifications/events/refund-requested`
- `/api/notifications/events/refund-resolved`
- `/api/notifications/events/manual-refund-followup`
- `/admin/notification-events`

## Local behavior

Notifications are still logged only. They are written to:

```text
.local-notifications/notifications.jsonl
```

## How to use from existing server actions

After an order is created:

```ts
import { notifyOrderCreated } from "@/lib/notification-events";

await notifyOrderCreated(order.id);
```

After shipping is updated:

```ts
import { notifyShippingUpdated } from "@/lib/notification-events";

await notifyShippingUpdated(order.id);
```

After a refund request is submitted:

```ts
import { notifyRefundRequested } from "@/lib/notification-events";

await notifyRefundRequested(order.id);
```

After seller approves/rejects a refund:

```ts
import { notifyRefundResolved } from "@/lib/notification-events";

await notifyRefundResolved(order.id);
```

After admin manual refund follow-up is needed:

```ts
import { notifyManualRefundFollowup } from "@/lib/notification-events";

await notifyManualRefundFollowup(order.id);
```

## API endpoint testing

POST JSON:

```json
{"orderId":"YOUR_ORDER_ID"}
```

to:

```text
/api/notifications/events/order-created
/api/notifications/events/shipping-updated
/api/notifications/events/refund-requested
/api/notifications/events/refund-resolved
/api/notifications/events/manual-refund-followup
```
