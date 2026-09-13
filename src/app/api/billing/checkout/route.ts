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

  let cycle: "monthly" | "yearly" = "monthly";
  let simulate = false;
  try {
    const body = await req.json();
    if (body?.cycle === "yearly") cycle = "yearly";
    if (body?.simulate === true) simulate = true;
  } catch {
    // Body optional, default to monthly
  }

  const db = createSupabaseAdmin();
  const { data: rest, error: rErr } = await db
    .from("restaurants")
    .select("id, name, slug, plan, razorpay_customer_id, razorpay_subscription_id")
    .eq("id", user.restaurantId)
    .single();

  if (rErr || !rest) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (rest.plan === "active") {
    return NextResponse.json(
      { error: "Your café already has an active subscription!" },
      { status: 409 },
    );
  }

  const amountPaise = cycle === "yearly" ? 999900 : 99900;
  const planTitle = cycle === "yearly" ? "QrSlice Complete (1 Year)" : "QrSlice Complete (1 Month)";

  // Developer / Sandbox Instant Activation
  if (simulate) {
    const mockSubId = `sub_sim_${Date.now()}`;
    await db
      .from("restaurants")
      .update({
        plan: "active",
        billing_status: "active",
        razorpay_subscription_id: mockSubId,
        subscription_ends_at: new Date(
          Date.now() + (cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .eq("id", user.restaurantId);

    return NextResponse.json({
      ok: true,
      simulated: true,
      subscription_id: mockSubId,
      message: "Subscription activated in sandbox mode!",
    });
  }

  // 1. Ensure Razorpay Customer (optional for Payment Links / Subscriptions)
  let customerId = rest.razorpay_customer_id;
  let customerEmail = "owner@qrslice.com";
  try {
    const { data: authUser } = await db.auth.admin.getUserById(user.userId);
    if (authUser?.user?.email) customerEmail = authUser.user.email;
  } catch {
    // ignore
  }

  if (
    !customerId ||
    !customerId.startsWith("cust_") ||
    customerId === "cust_guest" ||
    customerId.startsWith("cust_sim_")
  ) {
    const customer = await razorpay.createCustomer(customerEmail, rest.name);
    if (customer?.id && !customer.error) {
      customerId = customer.id;
      await db
        .from("restaurants")
        .update({ razorpay_customer_id: customerId })
        .eq("id", user.restaurantId);
    } else {
      customerId = null;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qr-cafe-blond.vercel.app";
  const callbackUrl = `${appUrl}/admin/billing?payment=success&cycle=${cycle}`;

  // 2. Check if recurring plan ID is configured
  const configuredPlanId =
    cycle === "yearly"
      ? process.env.RAZORPAY_PLAN_ID_YEARLY
      : process.env.RAZORPAY_PLAN_ID_PRO || process.env.RAZORPAY_PLAN_ID;

  const hasValidRecurringPlan =
    configuredPlanId &&
    !configuredPlanId.includes("XXX") &&
    !configuredPlanId.includes("placeholder") &&
    configuredPlanId !== "plan_qrslice_999";

  // If a dedicated recurring plan ID is present, try recurring subscription first
  if (hasValidRecurringPlan) {
    const sub = await razorpay.createSubscription(customerId, configuredPlanId, {
      restaurant_id: rest.id,
      slug: rest.slug,
      plan_name: planTitle,
      billing_cycle: cycle,
    });

    if (sub && sub.id && !sub.error) {
      await db
        .from("restaurants")
        .update({
          razorpay_subscription_id: sub.id,
          billing_status: "pending",
        })
        .eq("id", user.restaurantId);

      return NextResponse.json({
        ok: true,
        subscription_id: sub.id,
        short_url: sub.short_url || `https://rzp.io/i/${sub.id}`,
      });
    }
  }

  // 3. Robust Default: Generate Razorpay Hosted Payment Link (Works with ALL Razorpay Accounts)
  const link = await razorpay.createPaymentLink({
    amount: amountPaise,
    description: `${planTitle} - Restaurant Operating System`,
    customer: {
      name: rest.name,
      email: customerEmail,
    },
    notes: {
      restaurant_id: rest.id,
      slug: rest.slug,
      cycle,
      restaurant_name: rest.name,
    },
    callbackUrl,
  });

  if (link && link.short_url && !link.error) {
    await db
      .from("restaurants")
      .update({
        razorpay_subscription_id: link.id,
        billing_status: "pending",
      })
      .eq("id", user.restaurantId);

    return NextResponse.json({
      ok: true,
      short_url: link.short_url,
      payment_link_id: link.id,
    });
  }

  // 4. If Razorpay failed, return explicit diagnostics
  return NextResponse.json(
    {
      error: link?.error || "Failed to initiate Razorpay checkout.",
      details: link?.details,
      hint:
        link?.status === 401
          ? "Your Razorpay Key ID or Key Secret is unauthorized. Regenerate them from Razorpay Dashboard > Settings > API Keys and update your environment variables."
          : "Please verify that your Razorpay account is active and credentials are correct.",
    },
    { status: link?.status || 500 },
  );
}

