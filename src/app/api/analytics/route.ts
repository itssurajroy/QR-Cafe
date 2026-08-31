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

  // Query order history
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

  // Exact Payment Method Breakdown for Today (Cash vs UPI vs Card)
  let todayCashPaise = 0;
  let todayUpiPaise = 0;
  let todayCardPaise = 0;

  todayPaid.forEach((o) => {
    const pm = (o.payment_method || "counter").toLowerCase();
    if (pm === "online" || pm === "upi") {
      todayUpiPaise += o.total_paise || 0;
    } else if (pm === "card") {
      todayCardPaise += o.total_paise || 0;
    } else {
      todayCashPaise += o.total_paise || 0;
    }
  });

  // Overall payment method breakdown
  const paymentMethods: Record<string, number> = { counter: 0, online: 0 };
  orderList.forEach((o) => {
    const m = o.payment_method || "counter";
    paymentMethods[m] = (paymentMethods[m] || 0) + 1;
  });

  // Query top ordered items
  let itemQuery = admin
    .from("order_items")
    .select("item_name, quantity, line_total_paise, orders!inner(restaurant_id, created_at)");

  if (targetRestaurantId) {
    itemQuery = itemQuery.eq("orders.restaurant_id", targetRestaurantId);
  }

  const { data: itemRows } = await itemQuery;
  const itemMap: Record<string, { count: number; revenue: number }> = {};

  (itemRows || []).forEach((row: any) => {
    const name = row.item_name;
    if (!itemMap[name]) {
      itemMap[name] = { count: 0, revenue: 0 };
    }
    itemMap[name].count += row.quantity || 1;
    itemMap[name].revenue += row.line_total_paise || 0;
  });

  const topItems = Object.entries(itemMap)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
      paymentMethods,
    },
    topItems,
  });
}
