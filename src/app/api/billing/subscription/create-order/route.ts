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

  let cycle: "monthly" | "yearly" = "monthly";
  try {
    const body = await req.json();
    if (body?.cycle === "yearly") cycle = "yearly";
  } catch {
    // Body optional, default to monthly
  }

  const db = createSupabaseAdmin();
  const { data: rest, error: rErr } = await db
    .from("restaurants")
    .select("id, name, slug, plan, razorpay_customer_id")
    .eq("id", user.restaurantId)
    .single();

  if (rErr || !rest) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Idempotency: Check for existing pending payment for this restaurant/cycle
  const { data: existingPayment } = await db
    .from("billing_payments")
    .select("id, razorpay_order_id, status")
    .eq("restaurant_id", user.restaurantId)
    .eq("billing_cycle", cycle)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPayment?.razorpay_order_id) {
    // Return existing order for idempotency
    return NextResponse.json({
      ok: true,
      order_id: existingPayment.razorpay_order_id,
      amount: cycle === "yearly" ? 999900 : 99900,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID || "",
      idempotent: true,
    });
  }

  const amountPaise = cycle === "yearly" ? 999900 : 99900;
  const planTitle = cycle === "yearly" ? "QrSlice Complete (1 Year)" : "QrSlice Complete (1 Month)";

  // Create Razorpay order
  const order = await razorpay.createOrder(
    amountPaise,
    "INR",
    `sub_${rest.slug}_${cycle}_${Date.now()}`,
    {
      restaurant_id: rest.id,
      slug: rest.slug,
      plan_name: planTitle,
      billing_cycle: cycle,
    },
  );

  if (!order || order.error || !order.id) {
    const status = order?.status === 401 ? 401 : 500;
    return NextResponse.json(
      {
        error: order?.error || "Failed to create Razorpay order. Please verify the payment gateway configuration.",
        hint: order?.status === 401 ? "Your Razorpay Key ID or Key Secret is unauthorized. Regenerate them from Razorpay Dashboard > Settings > API Keys and update your environment variables." : undefined,
      },
      { status },
    );
  }

  // Store pending payment record for idempotency and verification
  await db.from("billing_payments").insert({
    restaurant_id: rest.id,
    razorpay_order_id: order.id,
    amount_paise: amountPaise,
    currency: "INR",
    billing_cycle: cycle,
    status: "pending",
    metadata: {
      plan_name: planTitle,
      restaurant_name: rest.name,
    },
  });

  return NextResponse.json({
    ok: true,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency || "INR",
    key_id: process.env.RAZORPAY_KEY_ID || "",
  });
}