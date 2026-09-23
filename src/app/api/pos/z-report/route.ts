// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { bucketPayments, dayRange } from "@/lib/z-report";

/**
 * A1: server-authoritative Z-report from payments (tender truth).
 * B7: day window from the tenant's restaurants.timezone.
 * Gated to owner / manager / super_admin (revenue + drawer data).
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canView =
    user.role === "owner" || user.role === "manager" || user.role === "super_admin";
  if (!canView) {
    return NextResponse.json(
      { error: "Forbidden: Z-report requires owner or manager role" },
      { status: 403 },
    );
  }

  const db = createSupabaseAdmin();

  const { data: restaurant } = await db
    .from("restaurants")
    .select("id, timezone, tax_rate, name")
    .eq("id", user.restaurantId)
    .maybeSingle();

  const day = dayRange(restaurant?.timezone, new Date());

  const { data: paymentRows, error: payErr } = await db
    .from("payments")
    .select("provider, amount_paise, status, created_at, order_id")
    .gte("created_at", day.start)
    .lt("created_at", day.end);

  if (payErr) {
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  // Restrict to this restaurant via its orders (payments has no restaurant_id).
  const { data: dayOrders, error: ordErr } = await db
    .from("orders")
    .select("id, order_number, total_paise, payment_status, status, created_at")
    .eq("restaurant_id", user.restaurantId)
    .gte("created_at", day.start)
    .lt("created_at", day.end);

  if (ordErr) {
    return NextResponse.json({ error: ordErr.message }, { status: 500 });
  }

  const orderIds = new Set((dayOrders || []).map((o) => o.id));
  const scopedPayments = (paymentRows || []).filter((p) => orderIds.has(p.order_id));
  const buckets = bucketPayments(scopedPayments);

  const paidOrders = (dayOrders || []).filter(
    (o) => o.payment_status === "paid" && o.status !== "cancelled",
  );

  // Top items for the day (from order_items of paid orders).
  let topItems: Array<{ name: string; count: number; revenue: number }> = [];
  if (paidOrders.length > 0) {
    const { data: itemRows } = await db
      .from("order_items")
      .select("item_name, quantity, line_total_paise, order_id")
      .in("order_id", paidOrders.map((o) => o.id));
    const byName = new Map<string, { name: string; count: number; revenue: number }>();
    for (const row of itemRows || []) {
      const key = row.item_name || "Item";
      const entry = byName.get(key) || { name: key, count: 0, revenue: 0 };
      entry.count += Number(row.quantity) || 0;
      entry.revenue += Number(row.line_total_paise) || 0;
      byName.set(key, entry);
    }
    topItems = [...byName.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }

  const taxRate = Number(restaurant?.tax_rate) || 0;
  // Inclusive-tax back-out: total = net * (1 + r/100) ⇒ tax portion = total * r/(100+r)
  const totalTaxPaise =
    buckets.total_paise > 0 && taxRate > 0
      ? Math.round((buckets.total_paise * taxRate) / (100 + taxRate))
      : 0;

  return NextResponse.json({
    ok: true,
    timezone: day.timezone,
    day: day.day,
    start: day.start,
    end: day.end,
    metrics: {
      todayRevenuePaise: buckets.total_paise,
      todayCashPaise: buckets.cash_paise,
      todayUpiPaise: buckets.upi_paise,
      todayCardPaise: buckets.card_paise,
      todayOtherPaise: buckets.other_paise,
      todayPaidCount: paidOrders.length,
      paymentCount: buckets.count,
      taxPaise: totalTaxPaise,
      taxRatePercent: taxRate,
    },
    orders: dayOrders || [],
    topItems,
  });
}
