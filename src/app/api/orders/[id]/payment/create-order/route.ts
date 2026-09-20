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

  const db = createSupabaseAdmin();

  const { data: order, error } = await db
    .from("orders")
    .select("id, total_paise, order_number, restaurant_id, payment_status, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json(
      { error: "Order is already paid" },
      { status: 409 },
    );
  }

  if (order.status === "cancelled" || order.status === "rejected") {
    return NextResponse.json(
      { error: "Cannot create payment for cancelled/rejected order" },
      { status: 422 },
    );
  }

  const amountPaise = order.total_paise;
  if (amountPaise < 100) {
    return NextResponse.json(
      { error: "Minimum payment amount is ₹1 (100 paise)" },
      { status: 400 },
    );
  }

  const receipt = `order_${order.order_number}_${Date.now()}`;

  const rzpOrder = await razorpay.createOrder(
    amountPaise,
    "INR",
    receipt,
    {
      order_id: order.id,
      order_number: order.order_number,
      restaurant_id: order.restaurant_id,
    },
  );

  if (!rzpOrder || rzpOrder.error || !rzpOrder.id) {
    const status = rzpOrder?.status === 401 ? 401 : 500;
    return NextResponse.json(
      {
        error: rzpOrder?.error || "Failed to create Razorpay order",
        hint:
          rzpOrder?.status === 401
            ? "Razorpay credentials invalid. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            : undefined,
      },
      { status },
    );
  }

  await db.from("payments").insert({
    order_id: order.id,
    provider: "razorpay",
    provider_order_id: rzpOrder.id,
    amount_paise: amountPaise,
    status: "pending",
  });

  return NextResponse.json({
    ok: true,
    order_id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency || "INR",
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  });
}