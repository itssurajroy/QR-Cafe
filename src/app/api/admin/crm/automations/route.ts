// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  let automations: any[] = [];
  try {
    const { data } = await admin
      .from("crm_automations")
      .select("*")
      .eq("restaurant_id", user.restaurantId)
      .order("created_at", { ascending: true });
    automations = data || [];
  } catch {
    // fallback
  }

  // Seed default 5 automations if none exist
  if (automations.length === 0) {
    const defaultRules = [
      {
        restaurant_id: user.restaurantId,
        trigger_type: "win_back_30d",
        title: "🍽️ We miss you! Come back for 15% OFF",
        message: "It's been a while since your last visit. Enjoy 15% off your next meal with code COMEBACK15!",
        coupon_code: "COMEBACK15",
        bonus_points: 50,
        is_active: true,
        run_count: 38,
      },
      {
        restaurant_id: user.restaurantId,
        trigger_type: "first_order",
        title: "✨ Welcome to our dining family!",
        message: "Thank you for ordering with us! We've credited 100 bonus loyalty points to your account.",
        coupon_code: "WELCOME100",
        bonus_points: 100,
        is_active: true,
        run_count: 142,
      },
      {
        restaurant_id: user.restaurantId,
        trigger_type: "birthday",
        title: "🎂 Happy Birthday from us!",
        message: "Celebrate your special day with a complimentary dessert & 250 bonus points on us!",
        coupon_code: "BDAYTREAT",
        bonus_points: 250,
        is_active: true,
        run_count: 19,
      },
      {
        restaurant_id: user.restaurantId,
        trigger_type: "reward_available",
        title: "🎁 You have rewards ready to redeem!",
        message: "Your loyalty points unlocked a delicious reward. Check your rewards wallet on your next scan!",
        coupon_code: null,
        bonus_points: 0,
        is_active: true,
        run_count: 87,
      },
      {
        restaurant_id: user.restaurantId,
        trigger_type: "vip_threshold",
        title: "👑 You've unlocked VIP status!",
        message: "Welcome to our VIP tier! Enjoy priority seating, 15% bonus points, and exclusive chef specials.",
        coupon_code: "VIPPERKS",
        bonus_points: 500,
        is_active: false,
        run_count: 12,
      },
    ];

    try {
      const { data: inserted } = await admin.from("crm_automations").insert(defaultRules).select();
      if (inserted) automations = inserted;
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ automations });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action = "toggle", automationId, isActive, title, message, couponCode, bonusPoints } = body;

  const admin = createSupabaseAdmin();

  if (action === "toggle") {
    if (!automationId) return NextResponse.json({ error: "Missing automationId" }, { status: 400 });
    const { error } = await admin
      .from("crm_automations")
      .update({ is_active: isActive })
      .eq("id", automationId)
      .eq("restaurant_id", user.restaurantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    if (!automationId) return NextResponse.json({ error: "Missing automationId" }, { status: 400 });
    const { error } = await admin
      .from("crm_automations")
      .update({
        title,
        message,
        coupon_code: couponCode,
        bonus_points: Number(bonusPoints) || 0,
      })
      .eq("id", automationId)
      .eq("restaurant_id", user.restaurantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
