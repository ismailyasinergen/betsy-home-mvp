# Betsy Home email notification system

This patch adds local-safe notification templates and logging.

## Local MVP behavior

No external email provider is required.

When a notification is triggered, it is:

- printed in the Next.js terminal
- written to `.local-notifications/notifications.jsonl`

## Templates included

- order confirmation
- seller new order alert
- shipping update
- refund request submitted
- refund approved
- refund rejected
- review reminder
- admin manual refund follow-up

## Test routes

Open:

```text
http://localhost:3000/admin/notifications
```

Trigger a local test notification:

```text
http://localhost:3000/api/notifications/test
```

## Production later

Before real launch:

- Add `EMAIL_FROM`
- Add `SUPPORT_EMAIL`
- Add a real provider such as Resend/SMTP
- Set `EMAIL_LOG_ONLY=false`
- Connect notification triggers to real order/refund/review events
