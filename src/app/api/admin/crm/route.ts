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
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const sort = searchParams.get("sort") || "last_visit_at"; // last_visit_at, total_spent, points
  const segment = searchParams.get("segment") || "all";
  const customerId = searchParams.get("customerId");

  const admin = createSupabaseAdmin();

  // If customerId requested, return deep customer profile
  if (customerId) {
    const { data: customer, error: custErr } = await admin
      .from("restaurant_customers")
      .select("*")
      .eq("id", customerId)
      .eq("restaurant_id", user.restaurantId)
      .single();

    if (custErr || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Fetch recent orders by phone or customer ID
    let orders: any[] = [];
    if (customer.phone) {
      const { data: ords } = await admin
        .from("orders")
        .select("id, order_number, total_paise, payment_status, payment_method, created_at, status, table_label")
        .eq("restaurant_id", user.restaurantId)
        .eq("customer_phone", customer.phone)
        .order("created_at", { ascending: false })
        .limit(10);
      orders = ords || [];
    }

    // Fetch loyalty transactions ledger
    let loyaltyLedger: any[] = [];
    try {
      const { data: txs } = await admin
        .from("loyalty_transactions")
        .select("*")
        .eq("customer_id", customerId)
        .eq("restaurant_id", user.restaurantId)
        .order("created_at", { ascending: false })
        .limit(20);
      loyaltyLedger = txs || [];
    } catch {
      // table may be newly created
    }

    // Fetch staff notes
    let notes: any[] = [];
    try {
      const { data: nts } = await admin
        .from("crm_customer_notes")
        .select("*")
        .eq("customer_id", customerId)
        .eq("restaurant_id", user.restaurantId)
        .order("created_at", { ascending: false });
      notes = nts || [];
    } catch {
      // table may be newly created
    }

    return NextResponse.json({
      customer,
      orders,
      loyaltyLedger,
      notes,
    });
  }

  // Fetch all customers for metrics and segmentation
  const { data: allCustomers, error: fetchErr } = await admin
    .from("restaurant_customers")
    .select("*")
    .eq("restaurant_id", user.restaurantId)
    .order("last_visit_at", { ascending: false });

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const list = allCustomers || [];
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Compute live segment groupings
  const segmentCounts = {
    all: list.length,
    new: list.filter((c) => c.created_at >= sevenDaysAgo || c.visit_count <= 1).length,
    returning: list.filter((c) => c.visit_count >= 2).length,
    vip: list.filter((c) => c.total_spent_paise >= 500000).length, // > ₹5,000
    inactive: list.filter((c) => c.last_visit_at <= thirtyDaysAgo).length, // > 30 days
    active: list.filter((c) => c.visit_count >= 3 && c.last_visit_at >= thirtyDaysAgo).length,
    high_spenders: list.filter((c) => c.visit_count > 0 && c.total_spent_paise / c.visit_count >= 100000).length, // AOV > ₹1,000
    loyalty_members: list.filter((c) => c.loyalty_points > 0).length,
  };

  // Compute CRM Overview KPIs
  const totalRevenuePaise = list.reduce((sum, c) => sum + (c.total_spent_paise || 0), 0);
  const totalVisits = list.reduce((sum, c) => sum + (c.visit_count || 0), 0);
  const totalPoints = list.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
  const avgOrderValuePaise = totalVisits > 0 ? Math.round(totalRevenuePaise / totalVisits) : 0;
  const repeatRate = list.length > 0 ? Math.round((segmentCounts.returning / list.length) * 100) : 0;

  const metrics = {
    totalCustomers: list.length,
    newThisMonth: list.filter((c) => c.created_at >= thirtyDaysAgo).length,
    activeCustomers: list.filter((c) => c.last_visit_at >= thirtyDaysAgo).length,
    repeatCustomers: segmentCounts.returning,
    vipCustomers: segmentCounts.vip,
    inactiveCustomers: segmentCounts.inactive,
    totalRevenuePaise,
    avgOrderValuePaise,
    repeatRate,
    totalPoints,
  };

  // Filter customers by selected segment
  let filtered = list;
  if (segment === "new") {
    filtered = list.filter((c) => c.created_at >= sevenDaysAgo || c.visit_count <= 1);
  } else if (segment === "returning") {
    filtered = list.filter((c) => c.visit_count >= 2);
  } else if (segment === "vip") {
    filtered = list.filter((c) => c.total_spent_paise >= 500000);
  } else if (segment === "inactive") {
    filtered = list.filter((c) => c.last_visit_at <= thirtyDaysAgo);
  } else if (segment === "active") {
    filtered = list.filter((c) => c.visit_count >= 3 && c.last_visit_at >= thirtyDaysAgo);
  } else if (segment === "high_spenders") {
    filtered = list.filter((c) => c.visit_count > 0 && c.total_spent_paise / c.visit_count >= 100000);
  } else if (segment === "loyalty_members") {
    filtered = list.filter((c) => c.loyalty_points > 0);
  }

  // Filter by search query
  if (q) {
    filtered = filtered.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }

  // Sort
  if (sort === "total_spent") {
    filtered.sort((a, b) => (b.total_spent_paise || 0) - (a.total_spent_paise || 0));
  } else if (sort === "points") {
    filtered.sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0));
  } else {
    filtered.sort((a, b) => new Date(b.last_visit_at).getTime() - new Date(a.last_visit_at).getTime());
  }

  return NextResponse.json({
    customers: filtered.slice(0, 150),
    segmentCounts,
    metrics,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { action = "adjust_points", customerId } = body;

  if (!customerId) {
    return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
  }

  // Action 1: Add Customer Note
  if (action === "add_note") {
    const { note, authorName = "Staff" } = body;
    if (!note || typeof note !== "string" || !note.trim()) {
      return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
    }

    try {
      const { data, error } = await admin
        .from("crm_customer_notes")
        .insert({
          restaurant_id: user.restaurantId,
          customer_id: customerId,
          author_name: authorName,
          note: note.trim().slice(0, 500),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, note: data });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to add note" }, { status: 500 });
    }
  }

  // Action 2: Adjust Loyalty Points (Ledger-backed)
  const { adjustPoints, reason } = body;
  if (typeof adjustPoints !== "number" || adjustPoints === 0) {
    return NextResponse.json({ error: "Invalid point adjustment amount" }, { status: 400 });
  }

  // Get current customer record
  const { data: cust, error: fetchErr } = await admin
    .from("restaurant_customers")
    .select("loyalty_points, name, phone")
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

  // Insert into loyalty ledger
  try {
    await admin.from("loyalty_transactions").insert({
      restaurant_id: user.restaurantId,
      customer_id: customerId,
      points: adjustPoints,
      balance_after: newPoints,
      type: "manual_adjustment",
      notes: reason || (adjustPoints > 0 ? "Manual bonus by staff" : "Manual deduction by staff"),
    });
  } catch {
    // ledger table fallback
  }

  // Audit log
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
