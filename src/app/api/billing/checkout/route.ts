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

  // 1. Ensure Razorpay Customer (Optional in Razorpay - omit if invalid)
  let customerId = rest.razorpay_customer_id;
  if (
    !customerId ||
    !customerId.startsWith("cust_") ||
    customerId === "cust_guest" ||
    customerId.startsWith("cust_sim_")
  ) {
    const { data: authUser } = await db.auth.admin.getUserById(user.userId);
    const email = authUser?.user?.email || "owner@qrslice.com";
    const customer = await razorpay.createCustomer(email, rest.name);
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

  // 2. Resolve or Auto-Create Plan
  let planId =
    cycle === "yearly"
      ? process.env.RAZORPAY_PLAN_ID_YEARLY
      : process.env.RAZORPAY_PLAN_ID_PRO || process.env.RAZORPAY_PLAN_ID;

  // If planId is missing or a placeholder, auto-provision the plan on Razorpay
  if (
    !planId ||
    planId.includes("XXX") ||
    planId.includes("placeholder") ||
    planId === "plan_qrslice_999"
  ) {
    const amountPaise = cycle === "yearly" ? 999900 : 99900;
    const planName = cycle === "yearly" ? "QrSlice Complete (Yearly)" : "QrSlice Complete (Monthly)";
    const createdPlan = await razorpay.createPlan(amountPaise, planName, cycle);
    if (createdPlan?.id) {
      planId = createdPlan.id;
    } else if (createdPlan?.error) {
      return NextResponse.json(
        {
          error: createdPlan.error,
          details: createdPlan.details,
          hint:
            createdPlan.status === 401
              ? "Razorpay authentication failed: Invalid Key ID or Key Secret. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Razorpay Dashboard > Settings > API Keys."
              : "Razorpay rejected the plan request.",
        },
        { status: createdPlan.status || 502 },
      );
    } else {
      planId = "plan_sim_default";
    }
  }

  if (!planId) {
    return NextResponse.json(
      {
        error: "Unable to resolve Razorpay Plan ID.",
        hint: "Please configure RAZORPAY_PLAN_ID_PRO in your environment variables.",
      },
      { status: 400 },
    );
  }

  // 3. Create Subscription
  const sub = await razorpay.createSubscription(customerId, planId, {
    restaurant_id: rest.id,
    slug: rest.slug,
    plan_name: cycle === "yearly" ? "QrSlice Complete (₹9,999/yr)" : "QrSlice Complete (₹999/mo)",
    billing_cycle: cycle,
  });

  if (!sub || sub.error || !sub.id) {
    return NextResponse.json(
      {
        error: sub?.error || "Failed to initiate Razorpay checkout.",
        details: sub?.details,
        hint:
          sub?.status === 401
            ? "Your Razorpay Key ID or Key Secret is unauthorized. Regenerate them from Razorpay Dashboard > Settings > API Keys and update your environment variables."
            : "Ensure your Razorpay plan is active and in the same mode (Test/Live).",
      },
      { status: sub?.status || 500 },
    );
  }

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
