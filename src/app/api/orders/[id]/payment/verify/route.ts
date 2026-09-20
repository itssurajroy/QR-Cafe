// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
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
      {
        error:
          "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
      },
      { status: 400 },
    );
  }

  const db = createSupabaseAdmin();

  const { data: paymentRecord, error: pErr } = await db
    .from("payments")
    .select("id, order_id, amount_paise, status, provider_order_id")
    .eq("provider_order_id", razorpayOrderId)
    .maybeSingle();

  if (pErr || !paymentRecord) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  if (paymentRecord.order_id !== id) {
    return NextResponse.json(
      { error: "Payment does not belong to this order" },
      { status: 403 },
    );
  }

  if (paymentRecord.status === "paid") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  let signatureValid = false;
  try {
    signatureValid = razorpay.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
  } catch {
    return NextResponse.json(
      { error: "Payment verification not configured (RAZORPAY_KEY_SECRET missing)" },
      { status: 500 },
    );
  }

  if (!signatureValid) {
    await db
      .from("payments")
      .update({
        status: "failed",
        provider_payment_id: razorpayPaymentId,
      })
      .eq("id", paymentRecord.id);

    return NextResponse.json(
      { error: "Payment signature verification failed" },
      { status: 400 },
    );
  }

  await db
    .from("payments")
    .update({
      status: "paid",
      provider_payment_id: razorpayPaymentId,
    })
    .eq("id", paymentRecord.id);

  await db
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: "online",
    })
    .eq("id", id);

  const { data: order } = await db
    .from("orders")
    .select("restaurant_id, total_paise, order_number, customer_phone, customer_name")
    .eq("id", id)
    .maybeSingle();

  if (order) {
    await db.from("audit_events").insert({
      restaurant_id: order.restaurant_id,
      entity: "order_payment",
      entity_id: id,
      action: "verified",
      metadata: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        amount_paise: paymentRecord.amount_paise,
        order_number: order.order_number,
        method: "online",
      },
    });
  }

  return NextResponse.json({ ok: true });
}