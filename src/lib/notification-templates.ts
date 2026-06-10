export type NotificationKind =
  | "order_confirmation"
  | "seller_new_order"
  | "shipping_update"
  | "refund_request_submitted"
  | "refund_approved"
  | "refund_rejected"
  | "review_reminder"
  | "admin_manual_refund_followup";

export type NotificationPayload = {
  orderNumber?: string;
  orderTotal?: string;
  shopName?: string;
  customerName?: string;
  customerEmail?: string;
  sellerEmail?: string;
  productTitle?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  refundReason?: string;
  resolutionNote?: string;
  adminReference?: string;
  actionUrl?: string;
};

export type RenderedNotification = {
  kind: NotificationKind;
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paragraph(lines: string[]) {
  return lines.filter(Boolean).join("\n");
}

function htmlPage(title: string, bodyLines: string[]) {
  const body = bodyLines
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#fbf4ea;padding:24px;color:#2b211d;">
    <div style="max-width:640px;margin:auto;background:#fff;border:1px solid #ead7c5;border-radius:20px;padding:28px;">
      <p style="letter-spacing:0.25em;text-transform:uppercase;color:#b85f45;font-weight:700;">Betsy Home</p>
      <h1 style="margin:0 0 16px;font-size:28px;">${escapeHtml(title)}</h1>
      ${body}
    </div>
  </body>
</html>`;
}

export function renderNotificationTemplate(
  kind: NotificationKind,
  payload: NotificationPayload
): RenderedNotification {
  const orderNumber = payload.orderNumber ?? "your order";
  const shopName = payload.shopName ?? "Betsy Home";
  const orderTotal = payload.orderTotal ?? "";
  const productTitle = payload.productTitle ?? "your item";
  const actionUrl = payload.actionUrl ?? "";

  switch (kind) {
    case "order_confirmation": {
      const subject = `Order confirmed: ${orderNumber}`;
      const lines = [
        `Thanks for your order from ${shopName}.`,
        orderTotal ? `Order total: ${orderTotal}` : "",
        actionUrl ? `View your order: ${actionUrl}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "seller_new_order": {
      const subject = `New order received: ${orderNumber}`;
      const lines = [
        `You received a new order for ${shopName}.`,
        productTitle ? `Item: ${productTitle}` : "",
        orderTotal ? `Order total: ${orderTotal}` : "",
        actionUrl ? `Manage this order: ${actionUrl}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "shipping_update": {
      const subject = `Shipping update for ${orderNumber}`;
      const lines = [
        `Your order from ${shopName} has a shipping update.`,
        payload.trackingCarrier ? `Carrier: ${payload.trackingCarrier}` : "",
        payload.trackingNumber ? `Tracking number: ${payload.trackingNumber}` : "",
        payload.trackingUrl ? `Track package: ${payload.trackingUrl}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "refund_request_submitted": {
      const subject = `Refund request submitted: ${orderNumber}`;
      const lines = [
        `A refund or cancellation request was submitted for ${orderNumber}.`,
        payload.refundReason ? `Reason: ${payload.refundReason}` : "",
        actionUrl ? `Review request: ${actionUrl}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "refund_approved": {
      const subject = `Refund approved: ${orderNumber}`;
      const lines = [
        `The refund request for ${orderNumber} was approved.`,
        payload.resolutionNote ? `Seller note: ${payload.resolutionNote}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "refund_rejected": {
      const subject = `Refund update: ${orderNumber}`;
      const lines = [
        `The refund request for ${orderNumber} was not approved.`,
        payload.resolutionNote ? `Seller note: ${payload.resolutionNote}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "review_reminder": {
      const subject = `How was your ${productTitle}?`;
      const lines = [
        `We hope your order from ${shopName} arrived safely.`,
        `Leave a review when you have a moment.`,
        actionUrl ? `Leave a review: ${actionUrl}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    case "admin_manual_refund_followup": {
      const subject = `Manual refund follow-up needed: ${orderNumber}`;
      const lines = [
        `A seller approved a refund, but a Stripe refund ID or manual reference still needs admin confirmation.`,
        payload.adminReference ? `Reference: ${payload.adminReference}` : "",
        actionUrl ? `Open admin refunds: ${actionUrl}` : "",
      ];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }

    default: {
      const subject = `Betsy Home notification`;
      const lines = [`A marketplace notification is available.`];
      return {
        kind,
        subject,
        text: paragraph(lines),
        html: htmlPage(subject, lines),
      };
    }
  }
}

export function getNotificationTemplatePreviews() {
  const sample: NotificationPayload = {
    orderNumber: "BH-20260606-GQL59-1",
    orderTotal: "$29.00",
    shopName: "Betsy Clay Atelier",
    productTitle: "Handmade Sage Green Ceramic Candle Holder",
    trackingCarrier: "DHL",
    trackingNumber: "JD014600006123456789",
    trackingUrl: "https://example.com/track",
    refundReason: "Found the same item cheaper on another seller.",
    resolutionNote: "Refund approved by seller.",
    adminReference: "manual-refund-test-001",
    actionUrl: "http://localhost:3000/account/orders",
  };

  const kinds: NotificationKind[] = [
    "order_confirmation",
    "seller_new_order",
    "shipping_update",
    "refund_request_submitted",
    "refund_approved",
    "refund_rejected",
    "review_reminder",
    "admin_manual_refund_followup",
  ];

  return kinds.map((kind) => renderNotificationTemplate(kind, sample));
}
