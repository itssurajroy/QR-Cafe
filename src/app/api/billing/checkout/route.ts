import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // 1. Ensure Razorpay Customer
  let customerId = rest.razorpay_customer_id;
  if (!customerId) {
    const { data: authUser } = await db.auth.admin.getUserById(user.userId);
    const email = authUser?.user?.email || "owner@qrcafe.com";
    const customer = await razorpay.createCustomer(email, rest.name);
    if (customer?.id) {
      customerId = customer.id;
      await db
        .from("restaurants")
        .update({ razorpay_customer_id: customerId })
        .eq("id", user.restaurantId);
    }
  }

  // 2. Single Plan ID (₹799/month All-in-One Unlimited)
  const planId = process.env.RAZORPAY_PLAN_ID_PRO || process.env.RAZORPAY_PLAN_ID || "plan_qrcafe_799";

  // 3. Create Subscription
  const sub = await razorpay.createSubscription(customerId || "cust_guest", planId, {
    restaurant_id: rest.id,
    slug: rest.slug,
    plan_name: "All-in-One Pro (₹799/mo)",
  });

  if (!sub || !sub.id) {
    return NextResponse.json(
      { error: "Failed to initiate Razorpay checkout" },
      { status: 500 },
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
