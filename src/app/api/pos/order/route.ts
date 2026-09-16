// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { deductInventoryIngredients } from "@/lib/inventory";
import { processCustomerLoyalty, redeemCustomerPoints } from "@/lib/crm";

// orders.payment_method is constrained to ('counter','online'): the channel
// category. POS methods cash/upi/card/mixed map to it; the exact method is kept in
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
    redeem_points = 0,
    payment_method = "cash",
    payment_status = "paid", // POS orders can be immediately settled
    split_cash_paise = 0,
    split_upi_paise = 0,
    notes = "",
    idempotency_key,
  } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Idempotency: if client provided a key, check for existing order
  if (idempotency_key) {
    const { data: existing } = await admin
      .from("orders")
      .select("id, status_token, order_number")
      .eq("idempotency_key", idempotency_key)
      .eq("restaurant_id", user.restaurantId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        ok: true,
        order: {
          id: existing.id,
          status_token: existing.status_token,
          order_number: existing.order_number,
        },
        idempotent: true,
      });
    }
  }

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

  // 1 Point = 1 Rupee = 100 Paise
  const maxRedeem = Math.floor((subtotal * 0.25) / 100); // 25% cap
  const pointsToUse = redeem_points > 0 ? Math.min(redeem_points, maxRedeem) : 0;
  const pointsDiscountPaise = pointsToUse * 100;

  const finalDiscountPaise = discount_paise + pointsDiscountPaise;
  const totalPaise = Math.max(0, subtotal - finalDiscountPaise);

// Generate POS Order Number
  const orderNumber = `POS-${Math.floor(Math.random() * 9000) + 1000}`;
  const validUuid = idempotency_key || crypto.randomUUID();

  let resolvedTableId = table_id || null;
  if (!resolvedTableId) {
    const { data: fallbackTable } = await admin
      .from("restaurant_tables")
      .select("id")
      .eq("restaurant_id", user.restaurantId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    resolvedTableId = fallbackTable?.id || null;
  }
  if (!resolvedTableId) {
    return NextResponse.json({ error: "No active table found for this café. Create a table first." }, { status: 400 });
  }

  // Insert Order (order_type validated: selector is source of truth)
  const validOrderType =
    order_type === "takeaway" || order_type === "delivery" ? order_type : "dine_in";
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      restaurant_id: user.restaurantId,
      table_id: resolvedTableId,
      order_number: orderNumber,
      subtotal_paise: subtotal,
      total_paise: totalPaise,
      discount_paise: finalDiscountPaise,
      payment_method: normalizePaymentMethod(payment_method),
      payment_status,
      status: payment_status === "paid" ? "preparing" : "pending",
      order_type: validOrderType,
      customer_name:
        customer_name ||
        (validOrderType === "takeaway"
          ? "Takeaway Guest"
          : validOrderType === "delivery"
            ? "Delivery Guest"
            : "Walk-in Guest"),
      customer_phone: customer_phone || "",
      idempotency_key: validUuid,
      status_token: validUuid,
    })
    .select()
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: oErr?.message || "Order creation failed" }, { status: 500 });
  }

  // Redeem points if applicable
  if (pointsToUse > 0 && customer_phone) {
    try {
      await redeemCustomerPoints(admin, user.restaurantId, customer_phone, pointsToUse, order.id);
    } catch (err) {
      console.error("Failed to redeem points:", err);
    }
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

  // Insert Payment records if paid
  if (payment_status === "paid") {
    if (payment_method === "mixed") {
      // Split payment
      const cashAmount = split_cash_paise > 0 ? split_cash_paise : Math.floor(totalPaise / 2);
      const upiAmount = split_upi_paise > 0 ? split_upi_paise : totalPaise - cashAmount;

      await admin.from("payments").insert([
        {
          order_id: order.id,
          provider: "cash",
          amount_paise: cashAmount,
          status: "success",
        },
        {
          order_id: order.id,
          provider: "upi_qr",
          amount_paise: upiAmount,
          status: "success",
        },
      ]);
    } else {
      await admin.from("payments").insert({
        order_id: order.id,
        provider: payment_method === "upi" ? "upi_qr" : payment_method === "card" ? "card_pos" : "cash",
        amount_paise: totalPaise,
        status: "success",
      });
    }
  }

  // Auto-deduct raw ingredient stock
  deductInventoryIngredients(admin, user.restaurantId, orderItemsData).catch((err) =>
    console.error("[POS] Inventory auto-deduction error:", err)
  );

  // Audit event
  await admin.from("audit_events").insert({
    restaurant_id: user.restaurantId,
    actor_id: user.userId,
    entity: "order",
    entity_id: order.id,
    action: "pos_billing",
      metadata: {
        order_number: orderNumber,
        order_type: validOrderType,
        payment_method,
        total_paise: totalPaise,
      },
  });

  // Loyalty processing (non-blocking)
  let loyaltyData = { pointsEarned: 0, newTotalPoints: 0 };
  if (customer_phone) {
    try {
      loyaltyData = await processCustomerLoyalty(
        admin,
        user.restaurantId,
        customer_phone,
        customer_name || "",
        totalPaise
      );
    } catch (err) {
      console.error("Loyalty processing failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    order: {
      ...order,
      order_items: orderItemsData,
      loyalty: loyaltyData,
    },
  });
}


