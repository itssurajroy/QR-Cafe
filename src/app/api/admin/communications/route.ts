// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// GET /api/admin/communications?type=whatsapp&status=failed&page=1&limit=20
// Tenant-scoped WhatsApp message history. `type` accepts `all` (default) and
// `whatsapp`; `email`/`sms` return an empty list (channels not yet available).
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "all").toLowerCase();
  const status = (searchParams.get("status") || "").trim() || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20),
  );

  // Only WhatsApp history exists — other channels are "coming soon", no fake rows.
  if (type !== "all" && type !== "whatsapp") {
    return NextResponse.json({ messages: [], total: 0, page, limit });
  }

  const isSuperAdmin = user.role === "super_admin";
  if (!isSuperAdmin && !user.restaurantId) {
    return NextResponse.json({ error: "No restaurant attached to user" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  let query = db
    .from("whatsapp_messages")
    .select(
      "id, tenant_id, order_id, message_type, recipient_phone, status, sent_at, created_at, error_message",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (!isSuperAdmin && user.restaurantId) {
    query = query.eq("tenant_id", user.restaurantId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const from = (page - 1) * limit;
  const { data: messages, count, error } = await query.range(from, from + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = messages || [];
  const messageIds = rows.map((m) => m.id);

  // Latest audit event per message (from whatsapp_message_events).
  const latestByMessage: Record<string, { event_type: string; created_at: string }> = {};
  if (messageIds.length > 0) {
    const { data: events } = await db
      .from("whatsapp_message_events")
      .select("message_id, event_type, created_at")
      .in("message_id", messageIds)
      .order("created_at", { ascending: false });
    for (const ev of events || []) {
      if (!latestByMessage[ev.message_id]) {
        latestByMessage[ev.message_id] = {
          event_type: ev.event_type,
          created_at: ev.created_at,
        };
      }
    }
  }

  // Human-readable order numbers for the Order column.
  const orderIds = [...new Set(rows.map((m) => m.order_id).filter(Boolean))] as string[];
  const orderNumbers: Record<string, number> = {};
  if (orderIds.length > 0) {
    let orderQuery = db.from("orders").select("id, order_number").in("id", orderIds);
    if (!isSuperAdmin && user.restaurantId) {
      orderQuery = orderQuery.eq("restaurant_id", user.restaurantId);
    }
    const { data: orders } = await orderQuery;
    for (const o of orders || []) {
      orderNumbers[o.id] = o.order_number;
    }
  }

  return NextResponse.json({
    messages: rows.map((m) => ({
      ...m,
      order_number: m.order_id ? (orderNumbers[m.order_id] ?? null) : null,
      latest_event: latestByMessage[m.id] ?? null,
    })),
    total: count ?? rows.length,
    page,
    limit,
  });
}
