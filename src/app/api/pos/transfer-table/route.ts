// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { POS_FLOOR_ROLES, requireRole } from "@/lib/pos-guard";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const transferSchema = z.object({
  order_ids: z.array(z.string().uuid()).min(1).max(50),
  destination_table_id: z.string().uuid(),
  destination_table_label: z.string().trim().min(1).max(64).optional(),
});

/**
 * Server-side table transfer: tenant-scoped order updates.
 * Replaces the previous client-side direct supabase updates loop.
 */
export async function POST(req: NextRequest) {
  const guard = await requireRole(POS_FLOOR_ROLES);
  if (!guard.ok) return guard.response;
  const { user } = guard;
  const restaurantId = user.restaurantId as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { order_ids, destination_table_id } = parsed.data;

  const db = createSupabaseAdmin();

  const { data: destTable, error: tErr } = await db
    .from("restaurant_tables")
    .select("id, label, restaurant_id, active")
    .eq("id", destination_table_id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (tErr || !destTable) {
    return NextResponse.json({ error: "Destination table not found" }, { status: 404 });
  }
  if (destTable.active === false) {
    return NextResponse.json({ error: "Destination table is inactive" }, { status: 422 });
  }

  const { data: scoped, error: sErr } = await db
    .from("orders")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .in("id", order_ids);

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }

  const allowedIds = (scoped || []).map((o) => o.id);
  if (allowedIds.length === 0) {
    return NextResponse.json({ error: "No matching orders" }, { status: 404 });
  }

  const { error: uErr } = await db
    .from("orders")
    .update({
      table_id: destTable.id,
      table_label: destTable.label,
    })
    .eq("restaurant_id", restaurantId)
    .in("id", allowedIds);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    transferred: allowedIds.length,
    skipped: order_ids.length - allowedIds.length,
    destination: { id: destTable.id, label: destTable.label },
  });
}
