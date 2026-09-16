// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

const logEventSchema = z.object({
  order_id: z.string().uuid().optional().nullable(),
  status_token: z.string().optional().nullable(),
  restaurant_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  event_type: z.enum(["sent", "receipt_viewed", "review_clicked", "feedback_submitted"]),
  phone: z.string().optional().nullable(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = logEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { order_id, status_token, event_type, phone, meta = {} } = parsed.data;
  let restaurantId = parsed.data.restaurant_id;
  let orderId = order_id || null;

  const db = createSupabaseAdmin();
  const sessionUser = await getSessionUser();

  // 1. If caller has an active session (POS / Staff), verify tenant authorization
  if (sessionUser) {
    if (sessionUser.role !== "super_admin") {
      if (restaurantId && restaurantId !== sessionUser.restaurantId) {
        return NextResponse.json({ error: "Forbidden: tenant mismatch" }, { status: 403 });
      }
      restaurantId = sessionUser.restaurantId || restaurantId;
    }
  }

  // 2. If unauthenticated customer call (e.g. from receipt page), verify ownership via status_token or order_id
  if (!sessionUser) {
    if (status_token) {
      const { data: orderData } = await db
        .from("orders")
        .select("id, restaurant_id")
        .eq("status_token", status_token)
        .maybeSingle();

      if (orderData) {
        orderId = orderData.id;
        restaurantId = orderData.restaurant_id;
      }
    } else if (orderId) {
      const { data: orderData } = await db
        .from("orders")
        .select("id, restaurant_id")
        .eq("id", orderId)
        .maybeSingle();

      if (orderData) {
        restaurantId = orderData.restaurant_id;
      }
    }
  }

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing or unresolved restaurant_id" }, { status: 400 });
  }

  // 3. Insert telemetry record into whatsapp_bill_events
  const { error } = await db.from("whatsapp_bill_events").insert({
    order_id: orderId,
    restaurant_id: restaurantId,
    tenant_id: restaurantId,
    event_type,
    phone: phone || null,
    meta,
  });

  if (error) {
    console.error("[WhatsApp Log Event] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event_type });
}
