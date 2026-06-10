const eventName = process.argv[2];
const orderId = process.argv[3];

const paths = {
  order_created: "/api/notifications/events/order-created",
  shipping_updated: "/api/notifications/events/shipping-updated",
  refund_requested: "/api/notifications/events/refund-requested",
  refund_resolved: "/api/notifications/events/refund-resolved",
  manual_refund_followup: "/api/notifications/events/manual-refund-followup",
};

if (!eventName || !orderId || !paths[eventName]) {
  console.log("Usage:");
  console.log("  node scripts/test-notification-event.cjs order_created ORDER_ID");
  console.log("Events:");
  Object.keys(paths).forEach((key) => console.log(`  ${key}`));
  process.exit(1);
}

fetch(`http://localhost:3000${paths[eventName]}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ orderId }),
})
  .then(async (response) => {
    const text = await response.text();
    console.log(response.status, text);
    if (!response.ok) process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
