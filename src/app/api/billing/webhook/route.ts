import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  // Verify signature if webhook secret is configured
  if (process.env.RAZORPAY_WEBHOOK_SECRET && !razorpay.verifyWebhook(rawBody, signature)) {
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

  const restaurantId =
    payload?.subscription?.entity?.notes?.restaurant_id ||
    payload?.payment?.entity?.notes?.restaurant_id;

  if (restaurantId) {
    if (eventType === "subscription.activated" || eventType === "subscription.charged") {
      await db
        .from("restaurants")
        .update({
          plan: "active",
          billing_status: "active",
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", restaurantId);
    } else if (eventType === "payment.captured") {
      await db
        .from("restaurants")
        .update({
          billing_status: "paid",
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", restaurantId);
    } else if (
      eventType === "payment.failed" ||
      eventType === "subscription.halted" ||
      eventType === "subscription.cancelled"
    ) {
      await db
        .from("restaurants")
        .update({
          plan: "suspended",
          billing_status: "past_due",
        })
        .eq("id", restaurantId);
    }

    // Log to audit events
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
