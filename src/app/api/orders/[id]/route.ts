// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { patchOrderSchema } from "@/lib/validation";
import { deductInventoryIngredients } from "@/lib/inventory";
import { processCustomerLoyalty, reverseCustomerLoyalty } from "@/lib/crm";

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "preparing", "rejected", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "completed", "cancelled"],
  served: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  unpaid: ["paid", "refunded"],
  paid: ["refunded", "unpaid"],
  refunded: ["unpaid"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = patchOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { status, payment_status, delay_minutes, delay_reason } = parsed.data;

  // Only managers, owners, and super_admins can modify payment status. Counter staff (staff, waiter, kitchen) cannot.
  const canManagePayments =
    user.role === "owner" || user.role === "manager" || user.role === "super_admin";
  if (payment_status && !canManagePayments) {
    return NextResponse.json(
      { error: "Forbidden: Only managers and owners can modify payment status" },
      { status: 403 },
    );
  }

  // Use admin client: session is validated by getSessionUser() and scoped by restaurant_id.
  const db = createSupabaseAdmin();

  // Load current order; RLS ensures it belongs to the caller's restaurant.
  const { data: order, error } = await db
    .from("orders")
    .select("id, status, payment_status, restaurant_id, customer_phone, customer_name, total_paise, order_number")
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
  }

  // Fetch delay field separately (avoids re-selecting entire row)
  let currentDelay = 0;
  try {
    const { data: delayData } = await db
      .from("orders")
      .select("delay_minutes")
      .eq("id", id)
      .maybeSingle();
    if (delayData) {
      currentDelay = (delayData as any).delay_minutes || 0;
    }
  } catch {
    /* ignore */
  }

  const updates: Record<string, unknown> = {};

  if (status && status !== order.status) {
    if (!TRANSITIONS[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${order.status} to ${status}` },
        { status: 422 },
      );
    }
    updates.status = status;
  }

  if (payment_status && payment_status !== order.payment_status) {
    if (!PAYMENT_TRANSITIONS[order.payment_status]?.includes(payment_status)) {
      return NextResponse.json(
        { error: `Invalid payment status transition from ${order.payment_status} to ${payment_status}` },
        { status: 422 },
      );
    }
    updates.payment_status = payment_status;
  }

  if (typeof delay_minutes === "number") {
    const newTotalDelay = currentDelay + delay_minutes;
    updates.delay_minutes = newTotalDelay;
    if (delay_reason) {
      updates.delay_reason = delay_reason;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const { error: updErr } = await db
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // audit_events has super_admin-only RLS — use admin client for this write only.
  const adminDb = createSupabaseAdmin();
  await adminDb.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: order.restaurant_id,
    entity: "order",
    entity_id: id,
    action: "update",
    metadata: {
      ...updates,
      ip,
    },
  });

  if (updates.status === "confirmed" || updates.status === "preparing") {
    // Deduct inventory when order is officially accepted by staff
    const { data: items } = await db
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", id);
    if (items && items.length > 0) {
      deductInventoryIngredients(db, order.restaurant_id, items).catch((err) =>
        console.error("Delayed inventory deduction failed:", err)
      );
    }
  }

  if (updates.payment_status === "paid" && order.payment_status !== "paid" && order.customer_phone) {
    processCustomerLoyalty(
      db,
      order.restaurant_id,
      order.customer_phone,
      order.customer_name || "",
      order.total_paise || 0,
      order.id,
      String(order.order_number || ""),
    ).catch((err) => console.error("[Loyalty] Processing error on order payment:", err));
  } else if (updates.payment_status === "refunded" && order.payment_status === "paid") {
    reverseCustomerLoyalty(
      db,
      order.restaurant_id,
      order.id,
      "Order Payment Refunded",
    ).catch((err) => console.error("[Loyalty] Reversal error on refund:", err));
  } else if (updates.status === "cancelled" && order.payment_status === "paid") {
    reverseCustomerLoyalty(
      db,
      order.restaurant_id,
      order.id,
      "Paid Order Cancelled",
    ).catch((err) => console.error("[Loyalty] Reversal error on cancellation:", err));
  }

  return NextResponse.json({ ok: true, updates });
}

