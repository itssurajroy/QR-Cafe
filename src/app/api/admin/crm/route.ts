// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "last_visit_at"; // last_visit_at, total_spent_paise, loyalty_points

  const admin = createSupabaseAdmin();
  let query = admin
    .from("restaurant_customers")
    .select("*")
    .eq("restaurant_id", user.restaurantId);

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  if (sort === "total_spent") {
    query = query.order("total_spent_paise", { ascending: false });
  } else if (sort === "points") {
    query = query.order("loyalty_points", { ascending: false });
  } else {
    query = query.order("last_visit_at", { ascending: false });
  }

  const { data: customers, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId, adjustPoints, reason } = await req.json();
  if (!customerId || typeof adjustPoints !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Get current points
  const { data: cust, error: fetchErr } = await admin
    .from("restaurant_customers")
    .select("loyalty_points")
    .eq("id", customerId)
    .eq("restaurant_id", user.restaurantId)
    .single();

  if (fetchErr || !cust) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const newPoints = Math.max(0, cust.loyalty_points + adjustPoints);

  const { error: updateErr } = await admin
    .from("restaurant_customers")
    .update({ loyalty_points: newPoints })
    .eq("id", customerId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Audit event for point adjustment
  await admin.from("audit_events").insert({
    restaurant_id: user.restaurantId,
    actor_id: user.userId,
    entity: "customer_points",
    entity_id: customerId,
    action: adjustPoints > 0 ? "points_added" : "points_deducted",
    metadata: {
      adjustment: adjustPoints,
      previous_balance: cust.loyalty_points,
      new_balance: newPoints,
      reason: reason || "Manual adjustment",
    },
  });

  return NextResponse.json({ success: true, newPoints });
}
