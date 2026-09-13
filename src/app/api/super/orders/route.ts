// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const PAGE_SIZE = 50;

// Cross-tenant order explorer — READ-ONLY by design.
// This file intentionally exports only GET (no POST/PATCH/DELETE).
export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams;
  const search = (q.get("q") || "").trim();
  const restaurantId = (q.get("restaurant_id") || "").trim();
  const status = (q.get("status") || "").trim();
  const from = (q.get("from") || "").trim();
  const to = (q.get("to") || "").trim();
  const page = Math.max(1, parseInt(q.get("page") || "1", 10));
  const fromIdx = (page - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  const db = createSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyFilters(query: any): any {
    let out = query;
    if (restaurantId) out = out.eq("restaurant_id", restaurantId);
    if (status) out = out.eq("status", status);
    if (from) out = out.gte("created_at", from);
    if (to) out = out.lte("created_at", to);
    if (search) out = out.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
    return out;
  }

  // Join orders + restaurant names; degrade gracefully if the
  // restaurants embed is unavailable in this environment.
  let orders: any[] | null = null;
  let total = 0;
  const withJoin = await applyFilters(
    db
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_method, total_paise, created_at, customer_name, restaurant_id, restaurants(name,slug)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
  ).range(fromIdx, toIdx);
  if (withJoin.error && /restaurant/i.test(withJoin.error.message)) {
    const fallback = await applyFilters(
      db
        .from("orders")
        .select(
          "id, order_number, status, payment_status, payment_method, total_paise, created_at, customer_name, restaurant_id",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
    ).range(fromIdx, toIdx);
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    orders = fallback.data ?? [];
    total = fallback.count ?? 0;
  } else {
    if (withJoin.error) return NextResponse.json({ error: withJoin.error.message }, { status: 500 });
    orders = withJoin.data ?? [];
    total = withJoin.count ?? 0;
  }

  // order_items count per order — order_items may be missing; degrade to 0.
  let counts: Record<string, number> = {};
  try {
    const ids = (orders ?? []).map((o: any) => o.id);
    if (ids.length > 0) {
      const { data, error } = await db.from("order_items").select("order_id").in("order_id", ids);
      if (!error) {
        for (const row of data ?? []) {
          const oid = (row as { order_id: string }).order_id;
          counts[oid] = (counts[oid] ?? 0) + 1;
        }
      }
    }
  } catch {
    counts = {};
  }

  const rows = (orders ?? []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status ?? null,
    payment_method: o.payment_method ?? null,
    total_paise: o.total_paise ?? 0,
    created_at: o.created_at,
    customer_name: o.customer_name ?? null,
    restaurant_id: o.restaurant_id ?? null,
    restaurant_name: o.restaurants?.name ?? null,
    restaurant_slug: o.restaurants?.slug ?? null,
    item_count: counts[o.id] ?? 0,
  }));

  return NextResponse.json({
    ok: true,
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
