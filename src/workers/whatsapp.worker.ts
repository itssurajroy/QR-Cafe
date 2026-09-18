// Copyright (c) 2026 QRslice. All rights reserved.
import { Worker, Job } from "bullmq";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { baileysClient } from "@/integrations/whatsapp/baileys/client";
import { redis } from "@/queues/whatsapp.queue";
import type { WhatsAppTemplate } from "@/integrations/whatsapp/whatsapp.types";
import {
  ORDER_CONFIRMED_TEMPLATE_NAME,
  buildOrderConfirmationVars,
  buildOrderConfirmedTemplate,
} from "@/integrations/whatsapp/templates/order-confirmation";

interface SendJobData {
  messageId: string;
}

async function updateMessageStatus(
  db: ReturnType<typeof createSupabaseAdmin>,
  messageId: string,
  status: string,
  updates: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await db
    .from("whatsapp_messages")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...updates,
    })
    .eq("id", messageId);

  if (error) {
    console.error(`[WhatsApp Worker] Failed to update message ${messageId} status to ${status}:`, error);
  }
}

async function logEvent(
  db: ReturnType<typeof createSupabaseAdmin>,
  tenantId: string,
  messageId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await db.from("whatsapp_message_events").insert({
    tenant_id: tenantId,
    message_id: messageId,
    event_type: eventType,
    payload,
  });

  if (error) {
    console.error(`[WhatsApp Worker] Failed to log event ${eventType} for message ${messageId}:`, error);
  }
}

async function processSendJob(job: Job<SendJobData>): Promise<void> {
  const { messageId } = job.data;
  const db = createSupabaseAdmin();

  // Fetch the outbound message
  const { data: message, error: msgError } = await db
    .from("whatsapp_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (msgError || !message) {
    console.error(`[WhatsApp Worker] Message ${messageId} not found:`, msgError);
    return;
  }

  const tenantId = message.tenant_id;

  // Check if already processed (idempotency)
  if (message.status !== "pending" && message.status !== "queued" && message.status !== "failed") {
    console.log(`[WhatsApp Worker] Message ${messageId} already in status ${message.status}, skipping`);
    return;
  }

  // Update status to queued
  await updateMessageStatus(db, messageId, "queued");
  await logEvent(db, tenantId, messageId, "queued", { attempt: job.attemptsMade + 1 });

  try {
    // Get WhatsApp account for this tenant
    const { data: account, error: accountError } = await db
      .from("whatsapp_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (accountError || !account || account.status !== "connected") {
      throw new Error("WhatsApp account not connected");
    }

    // Update status to sending
    await updateMessageStatus(db, messageId, "sending");
    await logEvent(db, tenantId, messageId, "sending", { recipient: message.recipient_phone });

    // Connect Baileys client
    await baileysClient.connect(tenantId);

    let result;
    const messageType = (message.message_type as string) || "";
    const storedTemplateName = (message.template_name as string) || "";
    if (
      messageType === ORDER_CONFIRMED_TEMPLATE_NAME ||
      storedTemplateName === ORDER_CONFIRMED_TEMPLATE_NAME
    ) {
      // Order confirmation: build typed template via the template builder,
      // then send through the Baileys transport. Template builders never
      // perform socket calls themselves.
      const tv = (message.template_variables as Record<string, unknown>) || {};
      const rawItems = Array.isArray(tv["items"])
        ? (tv["items"] as Array<{ name?: unknown; qty?: unknown; pricePaise?: unknown }>)
        : [];
      const vars = buildOrderConfirmationVars({
        orderNumber: String(
          tv["orderNumber"] ?? tv["order_number"] ?? tv["orderNo"] ?? "",
        ),
        tableLabel:
          (tv["tableLabel"] as string | undefined) ??
          (tv["table_number"] as string | undefined) ??
          undefined,
        items: rawItems.map((i) => ({
          name: String(i.name ?? ""),
          qty: Number(i.qty ?? 1),
          ...(i.pricePaise !== undefined
            ? { pricePaise: Number(i.pricePaise) }
            : {}),
        })),
        ...(tv["totalPaise"] !== undefined
          ? { totalPaise: Number(tv["totalPaise"]) }
          : {}),
        ...(tv["etaMinutes"] !== undefined
          ? { etaMinutes: Number(tv["etaMinutes"]) }
          : {}),
        ...((tv["restaurantName"] ?? tv["restaurant_name"]) !== undefined
          ? {
              restaurantName: String(
                tv["restaurantName"] ?? tv["restaurant_name"],
              ),
            }
          : {}),
      });
      const template = buildOrderConfirmedTemplate(vars);
      result = await baileysClient.sendTemplate(tenantId, message.recipient_phone, template);
    } else if (message.template_name && message.template_variables) {
      // Build template from stored variables
      const template: WhatsAppTemplate = {
        name: message.template_name,
        language: message.template_language || "en",
        components: [
          {
            type: "body",
            parameters: Object.entries(message.template_variables as Record<string, unknown>).map(([_, value]) => ({
              type: "text",
              text: String(value),
            })),
          },
        ],
      };
      result = await baileysClient.sendTemplate(tenantId, message.recipient_phone, template);
    } else if (message.document_url) {
      // Send document
      result = await baileysClient.sendDocument(tenantId, message.recipient_phone, {
        filename: message.document_filename || "document",
        mimeType: message.document_mime_type || "application/pdf",
        data: message.document_url,
        caption: message.template_variables?.caption as string,
      });
    } else {
      // Send plain text (fallback)
      const textContent = message.template_variables?.text as string || "Message from QRslice";
      result = await baileysClient.sendText(tenantId, message.recipient_phone, textContent);
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to send message");
    }

    // Success - update status to sent
    await updateMessageStatus(db, messageId, "sent", {
      provider_message_id: result.messageId,
      sent_at: new Date().toISOString(),
      retry_count: job.attemptsMade,
    });
    await logEvent(db, tenantId, messageId, "sent", { providerMessageId: result.messageId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const retryCount = job.attemptsMade + 1;
    const maxRetries = message.max_retries || 3;

    await logEvent(db, tenantId, messageId, "failed", { error: errorMessage, attempt: retryCount });

    if (retryCount >= maxRetries) {
      // Max retries exceeded - mark as failed permanently
      await updateMessageStatus(db, messageId, "failed", {
        error_message: errorMessage,
        error_code: "MAX_RETRIES_EXCEEDED",
        retry_count: retryCount,
      });
      await logEvent(db, tenantId, messageId, "bounced", { error: errorMessage, totalAttempts: retryCount });
    } else {
      // Will retry - update retry count and re-queue
      await updateMessageStatus(db, messageId, "failed", {
        error_message: errorMessage,
        retry_count: retryCount,
      });
      // Throw to trigger BullMQ retry
      throw error;
    }
  }
}

export const whatsappWorker = new Worker<SendJobData>("whatsapp-send", processSendJob, {
  connection: redis,
  concurrency: 5,
});

whatsappWorker.on("completed", (job) => {
  console.log(`[WhatsApp Worker] Job ${job.id} completed for message ${job.data.messageId}`);
});

whatsappWorker.on("failed", (job, err) => {
  console.error(`[WhatsApp Worker] Job ${job?.id} failed for message ${job?.data.messageId}:`, err);
});

whatsappWorker.on("error", (err) => {
  console.error("[WhatsApp Worker] Worker error:", err);
});