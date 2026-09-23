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
  const restaurantId =
    user.role === "super_admin"
      ? searchParams.get("restaurant_id") || user.restaurantId
      : user.restaurantId;

  // Use admin client: session is validated by getSessionUser() and scoped by restaurant_id.
  const db = createSupabaseAdmin();
  const { data: orders, error } = await db
    .from("orders")
    .select(
      "id, order_number, status, payment_status, priority, created_at, table_id, customer_name, customer_phone, restaurant_tables(label), order_items(id, item_name, quantity, notes, order_item_modifiers(option_name))",
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
    priority: Boolean(o.priority),
    created_at: o.created_at,
    table_label: o.restaurant_tables?.label ?? "Counter",
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    order_items: (o.order_items ?? []).map((oi: any) => ({
      id: oi.id,
      item_name: oi.item_name,
      quantity: oi.quantity,
      notes: oi.notes,
      modifiers: (oi.order_item_modifiers ?? []).map((m: any) => m.option_name),
    })),
  }));

  return NextResponse.json({ ok: true, orders: mapped });
}

