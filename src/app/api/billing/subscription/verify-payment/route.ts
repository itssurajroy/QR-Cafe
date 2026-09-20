// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Forbidden: Only restaurant owners can manage subscriptions" },
      { status: 403 },
    );
  }

  let razorpayOrderId: string;
  let razorpayPaymentId: string;
  let razorpaySignature: string;

  try {
    const body = await req.json();
    razorpayOrderId = String(body?.razorpay_order_id || "");
    razorpayPaymentId = String(body?.razorpay_payment_id || "");
    razorpaySignature = String(body?.razorpay_signature || "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json(
      { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature" },
      { status: 400 },
    );
  }

  const db = createSupabaseAdmin();

  // Verify the payment belongs to this restaurant (idempotency + ownership check)
  const { data: paymentRecord, error: pErr } = await db
    .from("billing_payments")
    .select("id, restaurant_id, amount_paise, billing_cycle, status")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (pErr || !paymentRecord) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  if (paymentRecord.restaurant_id !== user.restaurantId) {
    return NextResponse.json({ error: "Access denied: Payment does not belong to your restaurant" }, { status: 403 });
  }

  // Idempotency: already verified
  if (paymentRecord.status === "paid") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // Verify signature
  let signatureValid = false;
  try {
    signatureValid = razorpay.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  } catch {
    return NextResponse.json(
      { error: "Payment verification is not configured (RAZORPAY_KEY_SECRET missing)." },
      { status: 500 },
    );
  }

  if (!signatureValid) {
    await db
      .from("billing_payments")
      .update({ status: "failed", razorpay_payment_id: razorpayPaymentId })
      .eq("id", paymentRecord.id);

    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  // Signature verified - update payment record
  await db
    .from("billing_payments")
    .update({
      status: "paid",
      razorpay_payment_id: razorpayPaymentId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentRecord.id);

  // Activate/renew subscription
  const durationDays = paymentRecord.billing_cycle === "yearly" ? 365 : 30;
  const subEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  await db
    .from("restaurants")
    .update({
      plan: "active",
      billing_status: "active",
      subscription_ends_at: subEndsAt,
      razorpay_subscription_id: razorpayOrderId, // Store order ID as reference
    })
    .eq("id", user.restaurantId);

  // Audit log
  await db.from("audit_events").insert({
    restaurant_id: user.restaurantId,
    entity: "subscription_payment",
    action: "verified",
    metadata: {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      billing_cycle: paymentRecord.billing_cycle,
      amount_paise: paymentRecord.amount_paise,
    },
  });

  return NextResponse.json({ ok: true, subscription_ends_at: subEndsAt });
}