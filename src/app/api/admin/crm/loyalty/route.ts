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

  let tiers: any[] = [];
  try {
    const { data } = await admin
      .from("loyalty_tiers")
      .select("*")
      .eq("restaurant_id", user.restaurantId)
      .order("min_points", { ascending: true });
    tiers = data || [];
  } catch {
    // fallback
  }

  return NextResponse.json({ tiers });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action = "create", tierId, name, minPoints, maxPoints, color, displayName, benefits, isActive } = body;

  const admin = createSupabaseAdmin();

  if (action === "create") {
    if (!name || minPoints === undefined) {
      return NextResponse.json({ error: "Name and minPoints are required" }, { status: 400 });
    }

    const { data: newTier, error } = await admin
      .from("loyalty_tiers")
      .insert({
        restaurant_id: user.restaurantId,
        name,
        min_points: Number(minPoints),
        max_points: maxPoints !== undefined ? Number(maxPoints) : null,
        color: color || "#CD7F32",
        display_name: displayName || name,
        benefits: benefits || "{}",
        is_active: isActive !== false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tier: newTier });
  }

  if (action === "toggle") {
    if (!tierId) return NextResponse.json({ error: "Missing tierId" }, { status: 400 });
    const { error } = await admin
      .from("loyalty_tiers")
      .update({ is_active: isActive })
      .eq("id", tierId)
      .eq("restaurant_id", user.restaurantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    if (!tierId) return NextResponse.json({ error: "Missing tierId" }, { status: 400 });
    const { error } = await admin
      .from("loyalty_tiers")
      .update({
        name,
        min_points: Number(minPoints),
        max_points: maxPoints !== undefined ? Number(maxPoints) : null,
        color,
        display_name: displayName,
        benefits: benefits !== undefined ? benefits : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
      })
      .eq("id", tierId)
      .eq("restaurant_id", user.restaurantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}