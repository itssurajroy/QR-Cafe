// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { deductInventoryIngredients } from "@/lib/inventory";
import { processCustomerLoyalty, redeemCustomerPoints } from "@/lib/crm";
import { calculateAuthoritativePricing, type PricingItemInput } from "@/lib/pricing";

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
    payment_status = "paid",
    split_cash_paise = 0,
    split_upi_paise = 0,
    notes = "",
    idempotency_key,
  } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Idempotency check
  if (idempotency_key) {
    const { data: existing } = await admin
      .from("orders")
      .select("id, status_token, order_number, total_paise, subtotal_paise, payment_status")
      .eq("idempotency_key", idempotency_key)
      .eq("restaurant_id", user.restaurantId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        ok: true,
        order: existing,
        idempotent: true,
      });
    }
  }

  // Fetch restaurant details (tax rate)
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id, tax_rate")
    .eq("id", user.restaurantId)
    .maybeSingle();

  // Fetch catalog modifier config
  const { data: modConfig } = await admin
    .from("platform_config")
    .select("value")
    .eq("restaurant_id", user.restaurantId)
    .eq("key", "modifier_groups")
    .maybeSingle();

  const verifiedModifierPriceMap = new Map<string, number>();
  const rawGroups = modConfig?.value || [];
  if (Array.isArray(rawGroups)) {
    for (const group of rawGroups) {
      if (Array.isArray(group.options)) {
        for (const opt of group.options) {
          if (opt && typeof opt.name === "string") {
            verifiedModifierPriceMap.set(
              opt.name.trim().toLowerCase(),
              Number(opt.price_adjustment_paise) || 0,
            );
          }
        }
      }
    }
  }

  // Validate items
  const itemIds = items.map((i: any) => i.id || i.menu_item_id);
  const { data: dbItems, error: iErr } = await admin
    .from("menu_items")
    .select("id, name, price_paise, hsn")
    .in("id", itemIds)
    .eq("restaurant_id", user.restaurantId);

  if (iErr || !dbItems) {
    return NextResponse.json({ error: "Failed to validate items" }, { status: 500 });
  }

  const dbMap = new Map(dbItems.map((it) => [it.id, it]));

  // Build pricing inputs
  const pricingItems: PricingItemInput[] = [];
  for (const it of items) {
    const itemId = it.id || it.menu_item_id;
    const matched = dbMap.get(itemId);
    if (!matched) continue;

    const rawModifiers = Array.isArray(it.modifiers) ? it.modifiers : [];
    const sanitizedModifiers = rawModifiers.map((m: any) => {
      const optName = typeof m === "string" ? m : m.option_name || m.name || "";
      const optKey = optName.trim().toLowerCase();
      const catalogPrice = verifiedModifierPriceMap.get(optKey);
      const verifiedDelta = catalogPrice !== undefined ? catalogPrice : (Number(m.price_delta_paise) || 0);
      return {
        option_name: optName,
        price_delta_paise: verifiedDelta,
        quantity: Number(m.quantity) || 1,
      };
    });

    pricingItems.push({
      menu_item_id: matched.id,
      item_name: matched.name,
      base_price_paise: matched.price_paise,
      portion_name: it.portion_name || undefined,
      portion_delta_paise: Number(it.portion_delta_paise) || 0,
      modifiers: sanitizedModifiers,
      quantity: Number(it.quantity) || 1,
      notes: it.notes || "",
      hsn: matched.hsn || null,
    });
  }

  if (pricingItems.length === 0) {
    return NextResponse.json({ error: "No valid menu items in cart" }, { status: 400 });
  }

  // Validate loyalty balance if redeeming points
  let pointsToUse = 0;
  if (redeem_points > 0) {
    if (!customer_phone) {
      return NextResponse.json(
        { error: "Customer phone number is required to redeem loyalty points" },
        { status: 400 },
      );
    }
    const { data: cust } = await admin
      .from("restaurant_customers")
      .select("id, loyalty_points")
      .eq("restaurant_id", user.restaurantId)
      .eq("phone", customer_phone)
      .maybeSingle();

    if (!cust || (cust.loyalty_points || 0) < redeem_points) {
      return NextResponse.json(
        {
          error: `Insufficient loyalty points (available: ${cust?.loyalty_points || 0}, requested: ${redeem_points})`,
        },
        { status: 400 },
      );
    }
    pointsToUse = redeem_points;
  }

  // Authoritative server-side pricing engine calculation
  const taxRate = Number(restaurant?.tax_rate) || 0;
  const pricingResult = calculateAuthoritativePricing({
    items: pricingItems,
    discount_paise: Number(discount_paise) || 0,
    loyalty_points_to_redeem: pointsToUse,
    tax_rate_percent: taxRate,
  });

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
    return NextResponse.json(
      { error: "No active table found for this café. Create a table first." },
      { status: 400 },
    );
  }

  const validOrderType =
    order_type === "takeaway" || order_type === "delivery" ? order_type : "dine_in";

  // Persist Order with authoritative pricing snapshot
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      restaurant_id: user.restaurantId,
      table_id: resolvedTableId,
      order_number: orderNumber,
      subtotal_paise: pricingResult.subtotal_paise,
      tax_paise: pricingResult.tax_paise,
      discount_paise: pricingResult.discount_paise,
      total_paise: pricingResult.total_paise,
      pricing_snapshot: pricingResult.snapshot,
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
      notes: notes || "",
    })
    .select()
    .single();

  if (oErr || !order) {
    return NextResponse.json(
      { error: oErr?.message || "Order creation failed" },
      { status: 500 },
    );
  }

  // Deduct validated loyalty points and record transaction
  if (pointsToUse > 0 && customer_phone) {
    try {
      await redeemCustomerPoints(admin, user.restaurantId, customer_phone, pointsToUse, order.id);
    } catch (err) {
      console.error("[POS] Failed to redeem loyalty points:", err);
    }
  }

  // Insert Order Items
  const itemsToInsert = pricingResult.items.map((it) => ({
    order_id: order.id,
    menu_item_id: it.menu_item_id,
    item_name: it.item_name,
    unit_price_paise: it.unit_price_paise,
    quantity: it.quantity,
    line_total_paise: it.line_total_paise,
    notes: it.notes,
    hsn: it.hsn,
  }));

  const { data: insertedItems, error: itemsInsertErr } = await admin
    .from("order_items")
    .insert(itemsToInsert)
    .select("id");

  if (itemsInsertErr) {
    console.error("[POS] Order items insert failed:", itemsInsertErr);
  }

  // Insert Item Modifiers into order_item_modifiers
  if (insertedItems && insertedItems.length > 0) {
    const modRows: Array<{
      order_item_id: string;
      option_name: string;
      price_delta_paise: number;
    }> = [];

    pricingResult.items.forEach((it, idx) => {
      const parentId = insertedItems[idx]?.id;
      if (parentId) {
        it.modifiers.forEach((m) => {
          modRows.push({
            order_item_id: parentId,
            option_name: m.option_name,
            price_delta_paise: m.price_delta_paise,
          });
        });
      }
    });

    if (modRows.length > 0) {
      await admin.from("order_item_modifiers").insert(modRows);
    }
  }

  // Record payments
  if (payment_status === "paid") {
    if (payment_method === "mixed") {
      const cashAmount = split_cash_paise > 0 ? split_cash_paise : Math.floor(pricingResult.total_paise / 2);
      const upiAmount = split_upi_paise > 0 ? split_upi_paise : pricingResult.total_paise - cashAmount;

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
        amount_paise: pricingResult.total_paise,
        status: "success",
      });
    }
  }

  // Auto-deduct raw ingredient stock
  deductInventoryIngredients(admin, user.restaurantId, pricingResult.items).catch((err) =>
    console.error("[POS] Inventory deduction error:", err)
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
      total_paise: pricingResult.total_paise,
      subtotal_paise: pricingResult.subtotal_paise,
      tax_paise: pricingResult.tax_paise,
      discount_paise: pricingResult.discount_paise,
    },
  });

  // Loyalty processing on payment completion
  let loyaltyData = { pointsEarned: 0, newTotalPoints: 0 };
  if (payment_status === "paid" && customer_phone) {
    try {
      loyaltyData = await processCustomerLoyalty(
        admin,
        user.restaurantId,
        customer_phone,
        customer_name || "",
        pricingResult.total_paise,
        order.id,
        orderNumber,
      );
    } catch (err) {
      console.error("[POS] Loyalty processing failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    order: {
      ...order,
      order_items: pricingResult.items,
      loyalty: loyaltyData,
    },
  });
}
