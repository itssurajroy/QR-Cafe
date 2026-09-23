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
    console.error("Invalid webhook signature", { signature: signature.substring(0, 10) + "..." });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("Invalid JSON in webhook payload");
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

  // Extract restaurant_id from various event payloads
  let restaurantId: string | null = null;
  let isSubscriptionEvent = false;
  let isOrderEvent = false;

  const notes =
    payload?.subscription?.entity?.notes ||
    payload?.payment_link?.entity?.notes ||
    payload?.payment?.entity?.notes ||
    payload?.order?.entity?.notes;

  restaurantId = notes?.restaurant_id;

  // Determine event type
  if (eventType.startsWith("subscription.")) {
    isSubscriptionEvent = true;
    // For subscription events, restaurant_id might be in subscription.entity.notes
    restaurantId = restaurantId || payload?.subscription?.entity?.notes?.restaurant_id;
  } else if (eventType.startsWith("order.")) {
    isOrderEvent = true;
    // For order events, restaurant_id might be in order.entity.notes
    restaurantId = restaurantId || payload?.order?.entity?.notes?.restaurant_id;
  } else if (eventType.startsWith("payment.")) {
    // For payment events, restaurant_id might be in payment.entity.notes
    restaurantId = restaurantId || payload?.payment?.entity?.notes?.restaurant_id;
  } else if (eventType.startsWith("payment_link.")) {
    restaurantId = restaurantId || payload?.payment_link?.entity?.notes?.restaurant_id;
  }

  if (!restaurantId) {
    console.error("Could not determine restaurant_id from webhook", { eventType, eventId: event.id });
    return NextResponse.json({ ok: true, received: true, warning: "No restaurant_id found" });
  }

  // Verify restaurant exists
  const { data: restaurant, error: restErr } = await db
    .from("restaurants")
    .select("id, plan, billing_status")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restErr || !restaurant) {
    console.error("Restaurant not found for webhook", { restaurantId, eventType, eventId: event.id });
    return NextResponse.json({ ok: true, received: true, warning: "Restaurant not found" });
  }

  try {
    if (
      eventType === "subscription.activated" ||
      eventType === "subscription.charged" ||
      eventType === "payment_link.paid" ||
      eventType === "order.paid" ||
      eventType === "payment.captured"
    ) {
      // Determine billing cycle from notes or default to monthly
      const cycle = notes?.cycle || "monthly";
      const durationDays = cycle === "yearly" ? 365 : 30;

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

      // Update billing_payments record if exists
      const paymentId = payload?.payment?.entity?.id || payload?.order?.entity?.id;
      if (paymentId) {
        await db
          .from("billing_payments")
          .update({
            status: "paid",
            razorpay_payment_id: paymentId,
            verified_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", notes?.razorpay_order_id || payload?.order?.entity?.id);
      }
    } else if (eventType === "payment.failed") {
      // Determine if this is a subscription payment or order payment
      if (isSubscriptionEvent || notes?.razorpay_order_id) {
        // 5-Day Dunning Grace Period for subscription payments
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

        // Update billing_payments if exists
        if (notes?.razorpay_order_id) {
          await db
            .from("billing_payments")
            .update({
              status: "failed",
              razorpay_payment_id: payload?.payment?.entity?.id,
            })
            .eq("razorpay_order_id", notes.razorpay_order_id);
        }
      } else {
        // For order payments, just log - order payment failure handled elsewhere
        console.log("Order payment failed", { restaurantId, eventId: event.id });
      }
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
    } else if (eventType === "subscription.paused") {
      await db
        .from("restaurants")
        .update({
          billing_status: "paused",
        })
        .eq("id", restaurantId);
    } else if (eventType === "subscription.resumed") {
      await db
        .from("restaurants")
        .update({
          billing_status: "active",
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
        event_type: eventType,
        is_subscription: isSubscriptionEvent,
        is_order: isOrderEvent,
      },
    });

    // Insert into billing_events for Super Admin dashboard
    const amountPaise = payload?.payment?.entity?.amount || payload?.order?.entity?.amount || payload?.subscription?.entity?.amount || payload?.payment_link?.entity?.amount;
    await db.from("billing_events").insert({
      restaurant_id: restaurantId,
      provider: "razorpay",
      event_type: eventType,
      status: "processed",
      amount_paise: amountPaise || null,
      payload: event,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error("Error processing billing webhook", { error, eventType, eventId: event.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
