// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";
import { z } from "zod";

const createOrderSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
});

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { plan_id } = parsed.data;
  const db = createSupabaseAdmin();

  const { data: plan, error: planErr } = await db
    .from("subscription_plans")
    .select("id, name, slug, price_paise, billing_cycle, features")
    .eq("id", plan_id)
    .eq("active", true)
    .maybeSingle();

  if (planErr || !plan) {
    return NextResponse.json(
      { error: "Plan not found or inactive" },
      { status: 404 },
    );
  }

  const { data: rest, error: rErr } = await db
    .from("restaurants")
    .select("id, name, slug, plan, razorpay_customer_id")
    .eq("id", user.restaurantId)
    .single();

  if (rErr || !rest) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Idempotency: Check for existing pending payment for this restaurant/plan
  const { data: existingPayment } = await db
    .from("billing_payments")
    .select("id, razorpay_order_id, status")
    .eq("restaurant_id", user.restaurantId)
    .eq("metadata->>plan_id", plan.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPayment?.razorpay_order_id) {
    return NextResponse.json({
      ok: true,
      order_id: existingPayment.razorpay_order_id,
      amount: plan.price_paise,
      currency: "INR",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      idempotent: true,
    });
  }

  const amountPaise = plan.price_paise;
  if (amountPaise < 100) {
    return NextResponse.json(
      { error: "Invalid plan price" },
      { status: 400 },
    );
  }

  const receipt = `sub_${rest.slug}_${plan.slug}_${Date.now()}`;

  const order = await razorpay.createOrder(
    amountPaise,
    "INR",
    receipt,
    {
      restaurant_id: rest.id,
      slug: rest.slug,
      plan_id: plan.id,
      plan_name: plan.name,
      billing_cycle: plan.billing_cycle,
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

  await db.from("billing_payments").insert({
    restaurant_id: rest.id,
    razorpay_order_id: order.id,
    amount_paise: amountPaise,
    currency: "INR",
    billing_cycle: plan.billing_cycle,
    status: "pending",
    metadata: {
      plan_id: plan.id,
      plan_name: plan.name,
      restaurant_name: rest.name,
    },
  });

  return NextResponse.json({
    ok: true,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency || "INR",
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  });
}