// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";

type FunnelStage = {
  name: string;
  count: number;
  pctOfTotal: number;
  pctOfPrevious: number;
  description: string;
};

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams;
  const restaurantSlug = (q.get("restaurant") || "").trim();
  const dateRange = (q.get("range") || "30d").trim();
  const deviceFilter = (q.get("device") || "all").trim();

  const db = createSupabaseAdmin();

  // Determine date range
  let fromDate: Date;
  if (dateRange === "7d") fromDate = new Date(Date.now() - 7 * 864e5);
  else if (dateRange === "90d") fromDate = new Date(Date.now() - 90 * 864e5);
  else fromDate = new Date(Date.now() - 30 * 864e5);

  // Get restaurant filter
  let restaurantIds: string[] = [];
  if (restaurantSlug && restaurantSlug !== "all") {
    const { data: rest } = await db.from("restaurants").select("id").eq("slug", restaurantSlug).maybeSingle();
    if (rest) restaurantIds = [rest.id];
  }

  // 1. QR Code Scans - from table scans (orders with table_label)
  let scansQuery = db.from("orders").select("id, created_at, restaurant_id, table_label", { count: "exact" })
    .gte("created_at", fromDate.toISOString());
  if (restaurantIds.length > 0) scansQuery = scansQuery.in("restaurant_id", restaurantIds);
  const { count: scansCount } = await scansQuery;

  // 2. Menu Views - from orders that have items (proxy for menu views)
  // In real implementation, you'd track page views separately
  const { count: menuViewsCount } = await db
    .from("orders")
    .select("id", { count: "exact" })
    .gte("created_at", fromDate.toISOString())
    .not("table_label", "is", null);

  // 3. Item Views & Customization - orders with items
  const { count: itemViewsCount } = await db
    .from("order_items")
    .select("id", { count: "exact" })
    .gte("created_at", fromDate.toISOString());

  // 4. Cart Created - orders placed (all orders)
  const { count: cartCreatedCount } = await db
    .from("orders")
    .select("id", { count: "exact" })
    .gte("created_at", fromDate.toISOString());

  // 5. Checkout Started - orders with payment attempted
  const { count: checkoutCount } = await db
    .from("orders")
    .select("id", { count: "exact" })
    .gte("created_at", fromDate.toISOString())
    .in("payment_status", ["paid", "pending", "failed"]);

  // 6. Payment Started - orders with payment_method set
  const { count: paymentCount } = await db
    .from("orders")
    .select("id", { count: "exact" })
    .gte("created_at", fromDate.toISOString())
    .not("payment_method", "is", null);

  // 7. Order Completed - orders served/completed
  const { count: completedCount } = await db
    .from("orders")
    .select("id", { count: "exact" })
    .gte("created_at", fromDate.toISOString())
    .in("status", ["served", "completed"]);

  const total = scansCount || 0;

  const stages: FunnelStage[] = [
    {
      name: "QR Code Scans",
      count: total,
      pctOfTotal: 100,
      pctOfPrevious: 100,
      description: "Customer scanned table QR sticker with camera app / Google Lens",
    },
    {
      name: "Menu Views",
      count: menuViewsCount || 0,
      pctOfTotal: total > 0 ? Math.round(((menuViewsCount || 0) / total) * 1000) / 10 : 0,
      pctOfPrevious: total > 0 ? Math.round(((menuViewsCount || 0) / total) * 1000) / 10 : 0,
      description: "Digital menu successfully rendered in mobile browser",
    },
    {
      name: "Item Views & Customization",
      count: itemViewsCount || 0,
      pctOfTotal: total > 0 ? Math.round(((itemViewsCount || 0) / total) * 1000) / 10 : 0,
      pctOfPrevious: (menuViewsCount || 0) > 0 ? Math.round(((itemViewsCount || 0) / (menuViewsCount || 1)) * 1000) / 10 : 0,
      description: "Customer inspected item details, spicy levels, or add-ons",
    },
    {
      name: "Cart Created",
      count: cartCreatedCount || 0,
      pctOfTotal: total > 0 ? Math.round(((cartCreatedCount || 0) / total) * 1000) / 10 : 0,
      pctOfPrevious: (itemViewsCount || 0) > 0 ? Math.round(((cartCreatedCount || 0) / (itemViewsCount || 1)) * 1000) / 10 : 0,
      description: "Added at least 1 dish to dining order ticket",
    },
    {
      name: "Checkout Started",
      count: checkoutCount || 0,
      pctOfTotal: total > 0 ? Math.round(((checkoutCount || 0) / total) * 1000) / 10 : 0,
      pctOfPrevious: (cartCreatedCount || 0) > 0 ? Math.round(((checkoutCount || 0) / (cartCreatedCount || 1)) * 1000) / 10 : 0,
      description: "Customer verified table number & clicked Place Order",
    },
    {
      name: "Payment Started",
      count: paymentCount || 0,
      pctOfTotal: total > 0 ? Math.round(((paymentCount || 0) / total) * 1000) / 10 : 0,
      pctOfPrevious: (checkoutCount || 0) > 0 ? Math.round(((paymentCount || 0) / (checkoutCount || 1)) * 1000) / 10 : 0,
      description: "Selected UPI QR / Cash counter settlement mode",
    },
    {
      name: "Order Completed",
      count: completedCount || 0,
      pctOfTotal: total > 0 ? Math.round(((completedCount || 0) / total) * 1000) / 10 : 0,
      pctOfPrevious: (paymentCount || 0) > 0 ? Math.round(((completedCount || 0) / (paymentCount || 1)) * 1000) / 10 : 0,
      description: "KOT ticket routed to kitchen and bill finalized",
    },
  ];

  return NextResponse.json({ ok: true, stages, overallConversion: stages[stages.length - 1]?.pctOfTotal || 0 });
}