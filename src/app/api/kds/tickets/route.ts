import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId =
    user.role === "super_admin"
      ? searchParams.get("restaurant_id") || user.restaurantId
      : user.restaurantId;

  const admin = createSupabaseAdmin();
  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, created_at, table_id, customer_name, customer_phone, restaurant_tables(label), order_items(id, item_name, quantity, notes)",
    )
    .eq("restaurant_id", restaurantId)
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (orders || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    created_at: o.created_at,
    table_label: o.restaurant_tables?.label ?? "Counter",
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    order_items: o.order_items ?? [],
  }));

  return NextResponse.json({ ok: true, orders: mapped });
}
