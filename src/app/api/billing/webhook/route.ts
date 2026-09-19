// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  // Fail-closed signature verification
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Billing webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook verification not configured" }, { status: 500 });
  }

  if (!signature || !razorpay.verifyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const eventType = event.event;
  const payload = event.payload;

  // Idempotency: check if this webhook event has already been processed
  const { data: existingEvent } = await db
    .from("audit_events")
    .select("id")
    .eq("entity", "billing_webhook")
    .eq("metadata->>event_id", event.id)
    .maybeSingle();
  
  if (existingEvent) {
    return NextResponse.json({ ok: true, received: true, idempotent: true });
  }

  const notes =
    payload?.subscription?.entity?.notes ||
    payload?.payment_link?.entity?.notes ||
    payload?.payment?.entity?.notes ||
    payload?.order?.entity?.notes;

  const restaurantId = notes?.restaurant_id;

  if (restaurantId) {
    const cycle = notes?.cycle || "monthly";
    const durationDays = cycle === "yearly" ? 365 : 30;

    if (
      eventType === "subscription.activated" ||
      eventType === "subscription.charged" ||
      eventType === "payment_link.paid" ||
      eventType === "order.paid" ||
      eventType === "payment.captured"
    ) {
      await db
        .from("restaurants")
        .update({
          plan: "active",
          billing_status: "active",
          subscription_ends_at: new Date(
            Date.now() + durationDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq("id", restaurantId);
    } else if (eventType === "payment.failed") {
      // 5-Day Dunning Grace Period: Do NOT immediately suspend the restaurant dining room.
      // Set billing_status to 'past_due' and allow a 5-day retry window before suspension.
      const graceDays = 5;
      await db
        .from("restaurants")
        .update({
          billing_status: "past_due",
          subscription_ends_at: new Date(
            Date.now() + graceDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq("id", restaurantId);
    } else if (
      eventType === "subscription.halted" ||
      eventType === "subscription.cancelled"
    ) {
      // Dunning retries fully exhausted or explicitly cancelled by merchant
      await db
        .from("restaurants")
        .update({
          plan: "suspended",
          billing_status: "cancelled",
        })
        .eq("id", restaurantId);
    }

    // Log to audit events (this also serves as idempotency record)
    await db.from("audit_events").insert({
      restaurant_id: restaurantId,
      entity: "billing_webhook",
      action: eventType,
      metadata: {
        event_id: event.id,
        created_at: event.created_at,
      },
    });
  }

  return NextResponse.json({ ok: true, received: true });
}
