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

  let rewards: any[] = [];
  try {
    const { data } = await admin
      .from("loyalty_rewards")
      .select("*")
      .eq("restaurant_id", user.restaurantId)
      .order("points_required", { ascending: true });
    rewards = data || [];
  } catch {
    // fallback
  }

  // Seed default templates if empty
  if (rewards.length === 0) {
    const defaults = [
      {
        restaurant_id: user.restaurantId,
        name: "₹50 Off Next Order",
        reward_type: "fixed_discount",
        value_amount: 50,
        points_required: 250,
        min_order_paise: 25000,
        valid_days: 30,
        is_active: true,
      },
      {
        restaurant_id: user.restaurantId,
        name: "₹100 Off Bill",
        reward_type: "fixed_discount",
        value_amount: 100,
        points_required: 500,
        min_order_paise: 50000,
        valid_days: 30,
        is_active: true,
      },
      {
        restaurant_id: user.restaurantId,
        name: "Free Dessert Special",
        reward_type: "free_item",
        value_amount: 150,
        points_required: 800,
        min_order_paise: 30000,
        valid_days: 30,
        is_active: true,
      },
      {
        restaurant_id: user.restaurantId,
        name: "15% Off Total Bill",
        reward_type: "percent_discount",
        value_amount: 15,
        points_required: 1200,
        min_order_paise: 100000,
        valid_days: 45,
        is_active: true,
      },
    ];

    try {
      const { data: inserted } = await admin.from("loyalty_rewards").insert(defaults).select();
      if (inserted) rewards = inserted;
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ rewards });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action = "create", rewardId, name, rewardType, valueAmount, pointsRequired, minOrderPaise, validDays, isActive } = body;

  const admin = createSupabaseAdmin();

  if (action === "toggle") {
    if (!rewardId) return NextResponse.json({ error: "Missing rewardId" }, { status: 400 });
    const { error } = await admin
      .from("loyalty_rewards")
      .update({ is_active: isActive })
      .eq("id", rewardId)
      .eq("restaurant_id", user.restaurantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    if (!rewardId) return NextResponse.json({ error: "Missing rewardId" }, { status: 400 });
    const { error } = await admin
      .from("loyalty_rewards")
      .delete()
      .eq("id", rewardId)
      .eq("restaurant_id", user.restaurantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Create new reward
  if (!name || !pointsRequired) {
    return NextResponse.json({ error: "Name and Points Required are required" }, { status: 400 });
  }

  const { data: newReward, error } = await admin
    .from("loyalty_rewards")
    .insert({
      restaurant_id: user.restaurantId,
      name,
      reward_type: rewardType || "fixed_discount",
      value_amount: Number(valueAmount) || 0,
      points_required: Number(pointsRequired),
      min_order_paise: Number(minOrderPaise) || 0,
      valid_days: Number(validDays) || 30,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reward: newReward });
}
