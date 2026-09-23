// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";
import {
  cycleDurationDays,
  extractNotes,
  isSubscriptionPaymentNotes,
  resolveBillingCycle,
  resolveRazorpayOrderId,
} from "@/lib/billing-webhook";

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
    console.error("Invalid webhook signature");
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

  // Extract restaurant_id / order id from various event payloads
  let restaurantId: string | null = null;
  let isSubscriptionEvent = false;
  let isOrderEvent = false;

  const notes = extractNotes(payload);
  const razorpayOrderId = resolveRazorpayOrderId(payload, notes);

  restaurantId = typeof notes?.restaurant_id === "string" ? notes.restaurant_id : null;

  // Payment/order entities often carry no notes on payment.* events.
  // Fall back to the billing_payments row created by create-order.
  let lookupCycle: string | null = null;
  if (razorpayOrderId) {
    const { data: bp } = await db
      .from("billing_payments")
      .select("restaurant_id, billing_cycle")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    if (bp) {
      restaurantId = restaurantId || bp.restaurant_id;
      lookupCycle = bp.billing_cycle;
    }
  }

  // Determine event type
  if (eventType.startsWith("subscription.")) {
    isSubscriptionEvent = true;
    restaurantId = restaurantId || payload?.subscription?.entity?.notes?.restaurant_id || null;
  } else if (eventType.startsWith("order.")) {
    isOrderEvent = true;
    restaurantId = restaurantId || payload?.order?.entity?.notes?.restaurant_id || null;
  } else if (eventType.startsWith("payment.")) {
    restaurantId = restaurantId || payload?.payment?.entity?.notes?.restaurant_id || null;
  } else if (eventType.startsWith("payment_link.")) {
    restaurantId = restaurantId || payload?.payment_link?.entity?.notes?.restaurant_id || null;
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
      // Billing cycle: create-order writes billing_cycle, legacy checkout
      // writes cycle; fall back to the billing_payments row, then monthly.
      const cycle = resolveBillingCycle(notes, lookupCycle);
      const durationDays = cycleDurationDays(cycle);

      const restaurantPatch: Record<string, unknown> = {
        plan: "active",
        billing_status: "active",
        subscription_ends_at: new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
      if (typeof notes?.plan_id === "string") {
        restaurantPatch.subscription_plan_id = notes.plan_id;
      }

      let { error: updErr } = await db
        .from("restaurants")
        .update(restaurantPatch)
        .eq("id", restaurantId);

      // subscription_plan_id column may not be migrated yet — retry without it.
      if (updErr && String(updErr.message).includes("subscription_plan_id")) {
        delete restaurantPatch.subscription_plan_id;
        const retry = await db.from("restaurants").update(restaurantPatch).eq("id", restaurantId);
        updErr = retry.error;
      }
      if (updErr) throw updErr;

      // Update billing_payments record for Standard Checkout orders
      if (razorpayOrderId) {
        const paymentPatch: Record<string, unknown> = {
          status: "paid",
          verified_at: new Date().toISOString(),
        };
        const paymentId = payload?.payment?.entity?.id;
        if (paymentId) paymentPatch.razorpay_payment_id = paymentId;

        await db
          .from("billing_payments")
          .update(paymentPatch)
          .eq("razorpay_order_id", razorpayOrderId);
      }
    } else if (eventType === "payment.failed") {
      // 5-Day Dunning Grace Period for subscription payments only.
      // Order payments are identified by the absence of subscription notes
      // (plan_id / billing_cycle / cycle) and a billing_payments miss.
      const isSubscriptionPayment =
        isSubscriptionEvent || isSubscriptionPaymentNotes(notes) || Boolean(lookupCycle);

      if (isSubscriptionPayment) {
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

        // Update billing_payments if this failure maps to a checkout order
        if (razorpayOrderId) {
          await db
            .from("billing_payments")
            .update({
              status: "failed",
              razorpay_payment_id: payload?.payment?.entity?.id || null,
            })
            .eq("razorpay_order_id", razorpayOrderId);
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

    // Best-effort: feed the Super Admin dashboard. Never 500 after the
    // side effects above — a failure here must not trigger Razorpay retries
    // that the audit dedup would then swallow.
    try {
      const amountPaise =
        payload?.payment?.entity?.amount ||
        payload?.order?.entity?.amount ||
        payload?.subscription?.entity?.amount ||
        payload?.payment_link?.entity?.amount;
      await db.from("billing_events").insert({
        restaurant_id: restaurantId,
        provider: "razorpay",
        event_type: eventType,
        status: "processed",
        amount_paise: amountPaise || null,
        payload: event,
        processed_at: new Date().toISOString(),
      });
    } catch (beErr) {
      console.error("Non-fatal: failed to insert billing_events", { beErr, eventType, eventId: event.id });
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error("Error processing billing webhook", { error, eventType, eventId: event.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
