import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

// orders.payment_method is constrained to ('counter','online'): the channel
// category. POS methods cash/upi/card map to it; the exact method is kept in
// payments.provider.
function normalizePaymentMethod(pm: string): "counter" | "online" {
  const p = String(pm || "").toLowerCase();
  if (p === "online" || p === "upi" || p === "card") return "online";
  return "counter";
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Fetch all active orders (including served orders that are UNPAID so cashier can collect bill)
  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, payment_method, total_paise, subtotal_paise, created_at, table_id, customer_name, customer_phone, restaurant_tables(id, label, seats), order_items(*)",
    )
    .eq("restaurant_id", user.restaurantId)
    .or("status.in.(pending,confirmed,preparing,ready),and(status.eq.served,payment_status.eq.unpaid)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const liveOrders = (orders || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    total_paise: o.total_paise,
    subtotal_paise: o.subtotal_paise,
    created_at: o.created_at,
    table_id: o.table_id,
    table_label: o.restaurant_tables?.label || "Takeaway / Counter",
    customer_name: o.customer_name || "Guest",
    customer_phone: o.customer_phone,
    items: o.order_items || [],
  }));

  return NextResponse.json({ ok: true, orders: liveOrders });
}

export async function PATCH(req: NextRequest) {
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

  const { orderId, payment_status = "paid", payment_method = "cash", status } = body;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const updates: Record<string, any> = {
    payment_status,
    payment_method: normalizePaymentMethod(payment_method),
  };
  if (status) updates.status = status;

  const { data: updated, error } = await admin
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .eq("restaurant_id", user.restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert payment record if settling
  if (payment_status === "paid") {
    await admin.from("payments").insert({
      order_id: orderId,
      provider: payment_method === "upi" ? "upi_qr" : payment_method === "card" ? "card_pos" : "cash",
      amount_paise: updated.total_paise,
      status: "success",
    });
  }

  return NextResponse.json({ ok: true, order: updated });
}
