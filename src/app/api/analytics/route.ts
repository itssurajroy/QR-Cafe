// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetRestaurantId =
    user.role === "super_admin"
      ? searchParams.get("restaurant_id") || user.restaurantId
      : user.restaurantId;

  if (!targetRestaurantId && user.role !== "super_admin") {
    return NextResponse.json({ error: "No restaurant assigned" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Query order history for restaurant
  let orderQuery = admin
    .from("orders")
    .select("id, total_paise, payment_status, payment_method, status, created_at, restaurant_id");

  if (targetRestaurantId) {
    orderQuery = orderQuery.eq("restaurant_id", targetRestaurantId);
  }

  const { data: orders, error: oErr } = await orderQuery.order("created_at", { ascending: false });

  if (oErr) {
    return NextResponse.json({ error: oErr.message }, { status: 500 });
  }

  const orderList = orders || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orderList.filter((o) => (o.created_at || "").startsWith(todayStr));
  const paidOrders = orderList.filter((o) => o.payment_status === "paid");
  const todayPaid = todayOrders.filter((o) => o.payment_status === "paid");

  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
  const todayRevenue = todayPaid.reduce((sum, o) => sum + (o.total_paise || 0), 0);
  const avgOrderValue = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

  // Real payment method counts & paise totals for today
  let cashCount = 0;
  let upiCount = 0;
  let cardCount = 0;
  let todayCashPaise = 0;
  let todayUpiPaise = 0;
  let todayCardPaise = 0;

  todayPaid.forEach((o) => {
    const pm = (o.payment_method || "counter").toLowerCase();
    if (pm === "online" || pm === "upi" || pm === "qr") {
      upiCount++;
      todayUpiPaise += o.total_paise || 0;
    } else if (pm === "card") {
      cardCount++;
      todayCardPaise += o.total_paise || 0;
    } else {
      cashCount++;
      todayCashPaise += o.total_paise || 0;
    }
  });

  // Calculate real hourly order counts (8 AM to 11 PM) for today
  const defaultSlots = [
    { hour: "8 AM", h: 8, label: "Breakfast" },
    { hour: "9 AM", h: 9, label: "Coffee Rush" },
    { hour: "10 AM", h: 10, label: "Brunch" },
    { hour: "11 AM", h: 11, label: "Brunch Peak" },
    { hour: "12 PM", h: 12, label: "Lunch Rush" },
    { hour: "1 PM", h: 13, label: "Peak Lunch" },
    { hour: "2 PM", h: 14, label: "Post Lunch" },
    { hour: "3 PM", h: 15, label: "Afternoon" },
    { hour: "4 PM", h: 16, label: "Tea & Snacks" },
    { hour: "5 PM", h: 17, label: "Evening Rush" },
    { hour: "6 PM", h: 18, label: "Early Dinner" },
    { hour: "7 PM", h: 19, label: "Dinner Rush" },
    { hour: "8 PM", h: 20, label: "Dinner Peak" },
    { hour: "9 PM", h: 21, label: "Late Dinner" },
    { hour: "10 PM", h: 22, label: "Closing Orders" },
    { hour: "11 PM", h: 23, label: "Last Call" },
  ];

  const hourlySlots = defaultSlots.map((s) => ({ ...s, count: 0 }));

  todayOrders.forEach((o) => {
    if (!o.created_at) return;
    const d = new Date(o.created_at);
    const hour = d.getHours();
    const slot = hourlySlots.find((s) => s.h === hour);
    if (slot) {
      slot.count++;
    }
  });

  // Query top ordered items from real order_items
  let itemQuery = admin
    .from("order_items")
    .select("item_name, quantity, line_total_paise, orders!inner(restaurant_id, created_at)");

  if (targetRestaurantId) {
    itemQuery = itemQuery.eq("orders.restaurant_id", targetRestaurantId);
  }

  const { data: itemRows } = await itemQuery;
  const itemMap: Record<string, { quantity: number; revenue: number }> = {};

  (itemRows || []).forEach((row: any) => {
    const name = row.item_name;
    if (!name) return;
    if (!itemMap[name]) {
      itemMap[name] = { quantity: 0, revenue: 0 };
    }
    itemMap[name].quantity += row.quantity || 1;
    itemMap[name].revenue += row.line_total_paise || 0;
  });

  const topItems = Object.entries(itemMap)
    .map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return NextResponse.json({
    metrics: {
      totalOrders: orderList.length,
      paidOrders: paidOrders.length,
      totalRevenue,
      todayOrdersCount: todayOrders.length,
      todayPaidCount: todayPaid.length,
      todayRevenuePaise: todayRevenue,
      todayCashPaise,
      todayUpiPaise,
      todayCardPaise,
      avgOrderValue,
    },
    top_items: topItems,
    topItems,
    cash_count: cashCount,
    upi_count: upiCount,
    card_count: cardCount,
    hourly_slots: hourlySlots,
  });
}

