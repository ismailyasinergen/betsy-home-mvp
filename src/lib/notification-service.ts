import fs from "fs/promises";
import path from "path";
import {
  NotificationKind,
  NotificationPayload,
  renderNotificationTemplate,
} from "@/lib/notification-templates";

export type SendNotificationInput = {
  kind: NotificationKind;
  to: string;
  payload: NotificationPayload;
  cc?: string;
  bcc?: string;
};

function shouldLogOnly() {
  return process.env.EMAIL_LOG_ONLY !== "false" || !process.env.RESEND_API_KEY;
}

async function writeLocalNotification(entry: unknown) {
  const dir = path.join(process.cwd(), ".local-notifications");
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(
    path.join(dir, "notifications.jsonl"),
    `${JSON.stringify(entry)}\n`,
    "utf-8"
  );
}

export async function sendNotification(input: SendNotificationInput) {
  const rendered = renderNotificationTemplate(input.kind, input.payload);

  const entry = {
    createdAt: new Date().toISOString(),
    mode: shouldLogOnly() ? "log_only" : "provider_ready",
    to: input.to,
    cc: input.cc,
    bcc: input.bcc,
    subject: rendered.subject,
    kind: input.kind,
    text: rendered.text,
  };

  console.log("[notification]", entry);
  await writeLocalNotification(entry);

  // Local MVP intentionally logs only. Provider integration can be enabled later
  // without changing templates or event trigger points.
  return {
    ok: true,
    loggedOnly: shouldLogOnly(),
    subject: rendered.subject,
  };
}

export async function sendOrderConfirmation(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "order_confirmation", to, payload });
}

export async function sendSellerNewOrderAlert(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "seller_new_order", to, payload });
}

export async function sendShippingUpdate(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "shipping_update", to, payload });
}

export async function sendRefundRequestSubmitted(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "refund_request_submitted", to, payload });
}

export async function sendRefundApproved(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "refund_approved", to, payload });
}

export async function sendRefundRejected(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "refund_rejected", to, payload });
}

export async function sendReviewReminder(to: string, payload: NotificationPayload) {
  return sendNotification({ kind: "review_reminder", to, payload });
}

export async function sendAdminManualRefundFollowup(
  to: string,
  payload: NotificationPayload
) {
  return sendNotification({ kind: "admin_manual_refund_followup", to, payload });
}
