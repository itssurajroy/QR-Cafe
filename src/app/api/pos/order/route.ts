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

  const {
    table_id,
    order_type, // 'dine_in' | 'takeaway' | 'delivery'
    customer_name,
    customer_phone,
    items,
    discount_paise = 0,
    payment_method = "cash",
    payment_status = "paid", // POS orders can be immediately settled
    notes = "",
  } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Validate items and calculate subtotal
  const itemIds = items.map((i: any) => i.id);
  const { data: dbItems, error: iErr } = await admin
    .from("menu_items")
    .select("id, name, price_paise, hsn")
    .in("id", itemIds)
    .eq("restaurant_id", user.restaurantId);

  if (iErr || !dbItems) {
    return NextResponse.json({ error: "Failed to validate items" }, { status: 500 });
  }

  const dbMap = new Map(dbItems.map((it) => [it.id, it]));
  let subtotal = 0;
  const orderItemsData: any[] = [];

  for (const it of items) {
    const matched = dbMap.get(it.id);
    if (!matched) continue;
    const unitPrice = matched.price_paise;
    const lineTotal = unitPrice * (it.quantity || 1);
    subtotal += lineTotal;

    orderItemsData.push({
      menu_item_id: matched.id,
      item_name: matched.name,
      unit_price_paise: unitPrice,
      quantity: it.quantity || 1,
      line_total_paise: lineTotal,
      notes: it.notes || "",
      hsn: matched.hsn || null,
    });
  }

  const totalPaise = Math.max(0, subtotal - discount_paise);

  // Generate POS Order Number
  const orderNumber = `POS-${Math.floor(Math.random() * 9000) + 1000}`;
  const validUuid = crypto.randomUUID();

  // Insert Order
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      restaurant_id: user.restaurantId,
      table_id: table_id || null,
      order_number: orderNumber,
      subtotal_paise: subtotal,
      total_paise: totalPaise,
      discount_paise,
      payment_method: normalizePaymentMethod(payment_method),
      payment_status,
      status: payment_status === "paid" ? "preparing" : "pending",
      customer_name: customer_name || (order_type === "takeaway" ? "Takeaway Guest" : "Walk-in Guest"),
      customer_phone: customer_phone || null,
      idempotency_key: validUuid,
    })
    .select()
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: oErr?.message || "Order creation failed" }, { status: 500 });
  }

  // Insert Order Items
  const itemsToInsert = orderItemsData.map((oi) => ({
    order_id: order.id,
    menu_item_id: oi.menu_item_id,
    item_name: oi.item_name,
    unit_price_paise: oi.unit_price_paise,
    quantity: oi.quantity,
    line_total_paise: oi.line_total_paise,
    notes: oi.notes,
    hsn: oi.hsn,
  }));
  await admin.from("order_items").insert(itemsToInsert);

  // Insert Payment record if paid
  if (payment_status === "paid") {
    await admin.from("payments").insert({
      order_id: order.id,
      provider: payment_method === "upi" ? "upi_qr" : payment_method === "card" ? "card_pos" : "cash",
      amount_paise: totalPaise,
      status: "success",
    });
  }

  // Audit event
  await admin.from("audit_events").insert({
    restaurant_id: user.restaurantId,
    actor_id: user.userId,
    entity: "order",
    entity_id: order.id,
    action: "pos_billing",
    metadata: {
      order_number: orderNumber,
      order_type,
      payment_method,
      total_paise: totalPaise,
    },
  });

  return NextResponse.json({
    ok: true,
    order: {
      ...order,
      order_items: orderItemsData,
    },
  });
}
