// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // 1. Fetch all franchise outlets/restaurants
  const { data: restaurants, error: restErr } = await admin
    .from("restaurants")
    .select("id, name, slug, address, phone, logo_url, tagline, plan, tier, created_at")
    .order("created_at", { ascending: true });

  if (restErr) {
    return NextResponse.json({ error: restErr.message }, { status: 500 });
  }

  // 2. Fetch today's orders across all outlets for live revenue & order calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: ordersToday, error: orderErr } = await admin
    .from("orders")
    .select("id, restaurant_id, status, payment_status, total_paise, created_at")
    .gte("created_at", todayStart.toISOString());

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  const ordersByOutlet: Record<
    string,
    {
      revenueTodayPaise: number;
      ordersToday: number;
      activeOrdersCount: number;
      lastOrderTime: string | null;
    }
  > = {};

  (ordersToday || []).forEach((ord) => {
    const rid = ord.restaurant_id;
    if (!ordersByOutlet[rid]) {
      ordersByOutlet[rid] = {
        revenueTodayPaise: 0,
        ordersToday: 0,
        activeOrdersCount: 0,
        lastOrderTime: null,
      };
    }

    if (ord.status !== "cancelled") {
      ordersByOutlet[rid].ordersToday += 1;
      if (ord.payment_status === "paid" || ord.status === "completed" || ord.status === "delivered") {
        ordersByOutlet[rid].revenueTodayPaise += ord.total_paise || 0;
      }
    }

    if (["pending", "accepted", "cooking", "ready"].includes(ord.status)) {
      ordersByOutlet[rid].activeOrdersCount += 1;
    }

    if (
      !ordersByOutlet[rid].lastOrderTime ||
      new Date(ord.created_at) > new Date(ordersByOutlet[rid].lastOrderTime!)
    ) {
      ordersByOutlet[rid].lastOrderTime = ord.created_at;
    }
  });

  let franchiseTotalRevenuePaise = 0;
  let franchiseTotalOrders = 0;

  const outlets = (restaurants || []).map((r) => {
    const metrics = ordersByOutlet[r.id] || {
      revenueTodayPaise: 0,
      ordersToday: 0,
      activeOrdersCount: 0,
      lastOrderTime: null,
    };

    franchiseTotalRevenuePaise += metrics.revenueTodayPaise;
    franchiseTotalOrders += metrics.ordersToday;

    let status: "active" | "busy" | "closed" = "active";
    if (metrics.activeOrdersCount >= 5) {
      status = "busy";
    } else if (metrics.ordersToday === 0) {
      status = "closed";
    }

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      address: r.address || "Main Branch Location",
      phone: r.phone || "",
      logoUrl: r.logo_url,
      tagline: r.tagline,
      plan: r.plan,
      tier: r.tier,
      revenueTodayPaise: metrics.revenueTodayPaise,
      ordersToday: metrics.ordersToday,
      activeOrdersCount: metrics.activeOrdersCount,
      lastOrderTime: metrics.lastOrderTime,
      status,
    };
  });

  return NextResponse.json({
    ok: true,
    outlets,
    franchiseTotalRevenuePaise,
    franchiseTotalOrders,
    totalOutletsCount: outlets.length,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || (user.role !== "owner" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Owner permissions required" }, { status: 403 });
  }

  let body: { name?: string; slug?: string; address?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const name = body.name?.trim();
  let slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const address = body.address?.trim() || "";
  const phone = body.phone?.trim() || "";

  if (!name) {
    return NextResponse.json({ error: "Outlet Name is required" }, { status: 400 });
  }

  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  }

  const admin = createSupabaseAdmin();

  // Check slug uniqueness
  const { data: existing } = await admin.from("restaurants").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: `Slug '${slug}' is already taken. Please choose a different URL slug.` },
      { status: 400 }
    );
  }

  // Create new restaurant record
  const { data: newRest, error: createErr } = await admin
    .from("restaurants")
    .insert({
      name,
      slug,
      address,
      phone,
      plan: "active",
      tier: "pro",
    })
    .select()
    .single();

  if (createErr || !newRest) {
    return NextResponse.json({ error: createErr?.message || "Failed to create outlet" }, { status: 500 });
  }

  // Seed default starter categories and tables for the new outlet
  const defaultCategories = [
    { restaurant_id: newRest.id, name: "Starters & Appetizers", sort_order: 1 },
    { restaurant_id: newRest.id, name: "Main Course", sort_order: 2 },
    { restaurant_id: newRest.id, name: "Beverages & Drinks", sort_order: 3 },
  ];
  await admin.from("menu_categories").insert(defaultCategories);

  const defaultTables = [
    { restaurant_id: newRest.id, label: "T1", seats: 4, active: true },
    { restaurant_id: newRest.id, label: "T2", seats: 2, active: true },
    { restaurant_id: newRest.id, label: "T3", seats: 6, active: true },
    { restaurant_id: newRest.id, label: "T4", seats: 4, active: true },
    { restaurant_id: newRest.id, label: "T5", seats: 2, active: true },
  ];
  await admin.from("restaurant_tables").insert(defaultTables);

  return NextResponse.json({
    ok: true,
    outlet: {
      id: newRest.id,
      name: newRest.name,
      slug: newRest.slug,
      address: newRest.address || address,
      phone: newRest.phone || phone,
      revenueTodayPaise: 0,
      ordersToday: 0,
      activeOrdersCount: 0,
      lastOrderTime: null,
      status: "closed" as const,
    },
  });
}

