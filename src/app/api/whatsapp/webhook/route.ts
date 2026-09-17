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

  // Find the restaurant by verify_token
  const { data: settings, error } = await db
    .from("restaurant_whatsapp_settings")
    .select("verify_token")
    .eq("verify_token", token)
    .maybeSingle();

  if (error || !settings) {
    console.error("[WhatsApp Webhook] Invalid verify token:", token);
    return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
  }

  console.log("[WhatsApp Webhook] Verification successful for restaurant");
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

  // Find the restaurant by webhook_secret
  // We need to check all settings for matching webhook_secret
  const { data: allSettings, error: settingsError } = await db
    .from("restaurant_whatsapp_settings")
    .select("restaurant_id, webhook_secret")
    .not("webhook_secret", "is", null);

  if (settingsError || !allSettings || allSettings.length === 0) {
    console.error("[WhatsApp Webhook] No webhook secrets configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 403 });
  }

  // Find matching webhook secret
  let matchedSettings = null;
  for (const setting of allSettings) {
    if (!setting.webhook_secret) continue;
    
    const expectedSignature = "sha256=" + crypto
      .createHmac("sha256", setting.webhook_secret)
      .update(body)
      .digest("hex");
    
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      matchedSettings = setting;
      break;
    }
  }

  if (!matchedSettings) {
    console.error("[WhatsApp Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const restaurantId = matchedSettings.restaurant_id;

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
                await handleStatusUpdate(db, restaurantId, status);
              }
            }

            // Process incoming messages (optional - for future features)
            if (value.messages && Array.isArray(value.messages)) {
              for (const message of value.messages) {
                await handleIncomingMessage(db, restaurantId, message);
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleStatusUpdate(db: any, restaurantId: string, status: any) {
  const metaMessageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const timestamp = status.timestamp ? new Date(parseInt(status.timestamp) * 1000).toISOString() : new Date().toISOString();
  const error = status.errors ? JSON.stringify(status.errors) : null;

  // Update outbound message log
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
    .from("whatsapp_outbound_messages")
    .update(updateData)
    .eq("restaurant_id", restaurantId)
    .eq("meta_message_id", metaMessageId);

  if (dbError) {
    console.error("[WhatsApp Webhook] Failed to update outbound message:", dbError);
  } else {
    console.log(`[WhatsApp Webhook] Updated message ${metaMessageId} to ${statusType}`);
  }

  // Log the event for analytics
  await db.from("whatsapp_bill_events").insert({
    restaurant_id: restaurantId,
    tenant_id: restaurantId,
    event_type: statusType,
    meta: { meta_message_id: metaMessageId, status: statusType, error },
  });

  // Log the event for analytics
  await db.from("whatsapp_bill_events").insert({
    restaurant_id: restaurantId,
    tenant_id: restaurantId,
    event_type: statusType,
    meta: { meta_message_id: metaMessageId, status: statusType, error },
  });
}

async function handleIncomingMessage(db: any, restaurantId: string, message: any) {
  // Log incoming message for future features (e.g., customer replies)
  await db.from("whatsapp_bill_events").insert({
    restaurant_id: restaurantId,
    tenant_id: restaurantId,
    event_type: "incoming_message",
    phone: message.from,
    meta: { message },
  });
}