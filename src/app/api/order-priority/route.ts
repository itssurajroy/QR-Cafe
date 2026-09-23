// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { POS_ORDER_ROLES, requireRole } from "@/lib/pos-guard";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const prioritySchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  priority: z.boolean(),
});

/**
 * Persist KDS rush-priority flag on orders.priority (tenant-scoped).
 * Kitchen-facing roles can toggle; local-only priorityMap is no longer
 * the source of truth after a successful write.
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireRole(POS_ORDER_ROLES);
  if (!guard.ok) return guard.response;
  const { user } = guard;
  const restaurantId = user.restaurantId as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = prioritySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { order_id, priority } = parsed.data;
  const db = createSupabaseAdmin();

  const { data: order, error: oErr } = await db
    .from("orders")
    .select("id, priority, status")
    .eq("id", order_id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (oErr || !order) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
  }

  if (order.priority === priority) {
    return NextResponse.json({ ok: true, priority, unchanged: true });
  }

  const { error: updErr } = await db
    .from("orders")
    .update({ priority })
    .eq("id", order_id)
    .eq("restaurant_id", restaurantId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  await db.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: restaurantId,
    entity: "order",
    entity_id: order_id,
    action: "update",
    metadata: { priority, field: "priority" },
  });

  return NextResponse.json({ ok: true, priority });
}
