import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { computeOrderChecksum, generateAuditBlockHash } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // Generate server-side UUID if client didn't supply one or environment lacks crypto.randomUUID
  const idempotencyKey = input.idempotency_key || crypto.randomUUID();

  // Rate limit: per token and per IP
  const limit = Number(process.env.ORDER_RATE_LIMIT || 10);
  const window = Number(process.env.ORDER_RATE_WINDOW || 60);
  const rl = rateLimit(`${input.qr_token}:${ip}`, limit, window);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many orders from this device. Please wait a moment.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const db = createSupabaseAdmin();

  // Resolve QR token -> table + restaurant (server-side only)
  const { data: table, error: tErr } = await db
    .from("restaurant_tables")
    .select("id, restaurant_id, active, label, restaurants(plan, trial_ends_at)")
    .eq("qr_token", input.qr_token)
    .maybeSingle();
  if (tErr || !table || !table.active) {
    return NextResponse.json(
      { error: "Invalid or inactive table QR code. Please ask staff for assistance." },
      { status: 404 },
    );
  }

  // Gating: Verify restaurant plan and trial status
  const rest = (table as any).restaurants;
  const isPlanActive = rest?.plan === "active";
  const isTrialActive =
    rest?.plan === "trial" &&
    (!rest?.trial_ends_at || new Date(rest.trial_ends_at).getTime() > Date.now());

  if (!isPlanActive && !isTrialActive) {
    return NextResponse.json(
      { error: "Café subscription is inactive or trial has expired. Ordering is paused." },
      { status: 403 },
    );
  }

  // Idempotency: if this key already created an order, return existing
  const { data: existing } = await db
    .from("orders")
    .select("id, status_token, order_number")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      order_id: existing.id,
      status_token: existing.status_token,
      order_number: existing.order_number,
      idempotent: true,
    });
  }

  // Recompute prices + availability from DB (never trust client prices)
  const itemIds = Array.from(new Set(input.items.map((i) => i.menu_item_id)));
  const { data: menuItems, error: mErr } = await db
    .from("menu_items")
    .select("id, name, price_paise, available, category_id")
    .in("id", itemIds)
    .eq("restaurant_id", table.restaurant_id);
  if (mErr || !menuItems) {
    return NextResponse.json({ error: "Menu validation failed" }, { status: 500 });
  }
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const unavailable: string[] = [];
  let subtotal = 0;
  const orderItems: {
    menu_item_id: string;
    item_name: string;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
    notes: string;
    modifiers: { option_name: string; price_delta_paise: number }[];
  }[] = [];

  for (const ci of input.items) {
    const mi = byId.get(ci.menu_item_id);
    if (!mi) {
      unavailable.push("Item not found");
      continue;
    }
    if (!mi.available) {
      unavailable.push(mi.name);
      continue;
    }
    const modTotal = ci.modifiers.reduce(
      (s, m) => s + (Math.max(0, m.price_delta_paise) || 0),
      0,
    );
    const unit = mi.price_paise + modTotal;
    const line = unit * ci.quantity;
    subtotal += line;
    orderItems.push({
      menu_item_id: mi.id,
      item_name: mi.name,
      unit_price_paise: unit,
      quantity: ci.quantity,
      line_total_paise: line,
      notes: ci.notes || "",
      modifiers: ci.modifiers,
    });
  }

  if (orderItems.length === 0) {
    return NextResponse.json(
      { error: "No available items in cart", unavailable },
      { status: 409 },
    );
  }

  // Generate order number (retry on unique conflict)
  let orderNumber = "";
  let orderId = "";
  let statusToken = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    orderNumber = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${
      Math.floor(Math.random() * 9000) + 1000
    }`;
    const { data: ins, error: insErr } = await db
      .from("orders")
      .insert({
        restaurant_id: table.restaurant_id,
        table_id: table.id,
        order_number: orderNumber,
        subtotal_paise: subtotal,
        total_paise: subtotal,
        payment_method: input.payment_method,
        customer_name: input.customer_name ?? null,
        customer_phone: input.customer_phone ?? null,
        idempotency_key: idempotencyKey,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id, status_token")
      .single();
    if (insErr) {
      if (insErr.code === "23505") continue; // order_number collision
      return NextResponse.json({ error: "Order creation failed: " + insErr.message }, { status: 500 });
    }
    orderId = ins.id;
    statusToken = ins.status_token;
    break;
  }
  if (!orderId) {
    return NextResponse.json({ error: "Could not allocate order number" }, { status: 500 });
  }

  // Insert items + modifiers
  const itemRows = orderItems.map((oi) => ({
    order_id: orderId,
    menu_item_id: oi.menu_item_id,
    item_name: oi.item_name,
    unit_price_paise: oi.unit_price_paise,
    quantity: oi.quantity,
    line_total_paise: oi.line_total_paise,
    notes: oi.notes,
  }));
  const { data: insertedItems, error: oiErr } = await db
    .from("order_items")
    .insert(itemRows)
    .select("id");
  if (oiErr) {
    return NextResponse.json({ error: "Failed to persist order items: " + oiErr.message }, { status: 500 });
  }

  const modRows: {
    order_item_id: string;
    option_name: string;
    price_delta_paise: number;
  }[] = [];
  orderItems.forEach((oi, idx) => {
    const insertedId = insertedItems[idx]?.id;
    if (insertedId) {
      oi.modifiers.forEach((m) =>
        modRows.push({
          order_item_id: insertedId,
          option_name: m.option_name,
          price_delta_paise: m.price_delta_paise,
        }),
      );
    }
  });
  if (modRows.length) {
    await db.from("order_item_modifiers").insert(modRows);
  }

  // Fetch last audit hash to chain blocks
  const { data: lastAudit } = await db
    .from("audit_events")
    .select("metadata")
    .eq("restaurant_id", table.restaurant_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevHash = (lastAudit?.metadata as any)?.block_hash || null;
  const payloadHash = computeOrderChecksum(input.items);
  const blockHash = generateAuditBlockHash(prevHash, {
    order_id: orderId,
    order_number: orderNumber,
    subtotal,
    payload_hash: payloadHash,
    ip,
  });

  // Audit event with cryptographic security metadata
  await db.from("audit_events").insert({
    restaurant_id: table.restaurant_id,
    entity: "order",
    entity_id: orderId,
    action: "create",
    metadata: {
      source: "qr",
      order_number: orderNumber,
      payload_hash: payloadHash,
      block_hash: blockHash,
      prev_hash: prevHash,
      ip,
      userAgent: userAgent.slice(0, 150),
    },
  });

  return NextResponse.json({
    order_id: orderId,
    status_token: statusToken,
    order_number: orderNumber,
    checksum: payloadHash.slice(0, 12),
    unavailable,
  });
}
