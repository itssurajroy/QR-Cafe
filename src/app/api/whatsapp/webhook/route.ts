// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!mode || !token || !challenge) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (mode !== "subscribe") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  // Find the restaurant by verify_token in whatsapp_accounts
  const { data: account, error } = await db
    .from("whatsapp_accounts")
    .select("tenant_id, verify_token")
    .eq("verify_token", token)
    .maybeSingle();

  if (error || !account) {
    console.error("[WhatsApp Webhook] Invalid verify token:", token);
    return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
  }

  console.log("[WhatsApp Webhook] Verification successful for tenant:", account.tenant_id);
  return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(req: NextRequest) {
  const db = createSupabaseAdmin();
  const signature = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  // Verify signature
  if (!signature) {
    console.error("[WhatsApp Webhook] Missing signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  let matchedAccount = null;

  // 1. Try O(1) direct lookup by phone_number_id if present in Meta payload
  try {
    const preview = JSON.parse(body);
    const phoneNumberId = preview?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    if (phoneNumberId) {
      const { data: directAccount } = await db
        .from("whatsapp_accounts")
        .select("tenant_id, webhook_secret")
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();

      if (directAccount?.webhook_secret) {
        const expectedSignature =
          "sha256=" +
          crypto
            .createHmac("sha256", directAccount.webhook_secret)
            .update(body)
            .digest("hex");

        if (
          signature.length === expectedSignature.length &&
          crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
        ) {
          matchedAccount = directAccount;
        }
      }
    }
  } catch {
    /* ignore json preview parse failure */
  }

  // 2. Fallback: match against configured accounts pool
  if (!matchedAccount) {
    const { data: accounts, error: accountsError } = await db
      .from("whatsapp_accounts")
      .select("tenant_id, webhook_secret")
      .not("webhook_secret", "is", null);

    if (accountsError || !accounts || accounts.length === 0) {
      console.error("[WhatsApp Webhook] No webhook secrets configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 403 });
    }

    for (const account of accounts) {
      if (!account.webhook_secret) continue;

      const expectedSignature =
        "sha256=" +
        crypto
          .createHmac("sha256", account.webhook_secret)
          .update(body)
          .digest("hex");

      if (
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        matchedAccount = account;
        break;
      }
    }
  }

  if (!matchedAccount) {
    console.error("[WhatsApp Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const tenantId = matchedAccount.tenant_id;

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Process webhook entry
  if (payload.entry && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            const value = change.value;
            
            // Process status updates
            if (value.statuses && Array.isArray(value.statuses)) {
              for (const status of value.statuses) {
                await handleStatusUpdate(db, tenantId, status);
              }
            }

            // Process incoming messages (optional - for future features)
            if (value.messages && Array.isArray(value.messages)) {
              for (const message of value.messages) {
                await handleIncomingMessage(db, tenantId, message);
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleStatusUpdate(db: any, tenantId: string, status: any) {
  const providerMessageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const timestamp = status.timestamp ? new Date(parseInt(status.timestamp) * 1000).toISOString() : new Date().toISOString();
  const error = status.errors ? JSON.stringify(status.errors) : null;

  // Update outbound message log using provider_message_id
  const updateData: any = {
    status: statusType === "failed" ? "failed" : statusType,
    meta_response: { status },
    updated_at: new Date().toISOString(),
  };

  if (statusType === "sent") {
    updateData.sent_at = timestamp;
  } else if (statusType === "delivered") {
    updateData.delivered_at = timestamp;
  } else if (statusType === "read") {
    updateData.read_at = timestamp;
  }

  if (error) {
    updateData.error_message = error;
  }

  const { error: dbError } = await db
    .from("whatsapp_messages")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("provider_message_id", providerMessageId);

  if (dbError) {
    console.error("[WhatsApp Webhook] Failed to update outbound message:", dbError);
  } else {
    console.log(`[WhatsApp Webhook] Updated message ${providerMessageId} to ${statusType}`);
  }

  // Get the message_id for event logging
  const { data: message } = await db
    .from("whatsapp_messages")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("provider_message_id", providerMessageId)
    .maybeSingle();

  // Log the event for analytics
  if (message) {
    const eventType = statusType === "failed" ? "failed" : statusType;
    await db.from("whatsapp_message_events").insert({
      tenant_id: tenantId,
      message_id: message.id,
      event_type: eventType,
      provider_event_id: providerMessageId,
      payload: { meta_message_id: providerMessageId, status: statusType, error },
      error_message: error,
    });
  }
}

async function handleIncomingMessage(db: any, tenantId: string, message: any) {
  // Log incoming message for future features (e.g., customer replies)
  await db.from("whatsapp_message_events").insert({
    tenant_id: tenantId,
    message_id: null, // No associated outbound message
    event_type: "webhook_received",
    provider_event_id: message.id,
    payload: { message },
  });
}