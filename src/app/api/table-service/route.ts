// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { qr_token, request_type = "waiter", notes = "" } = body;
  if (!qr_token) {
    return NextResponse.json({ error: "qr_token required" }, { status: 400 });
  }

  // Rate limit: max 3 requests per 60s window per table/IP to prevent spam
  const rl = rateLimit(`table-service:${qr_token}:${ip}`, 3, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many service requests. Please wait a moment.", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  const admin = createSupabaseAdmin();
  const { data: table, error: tErr } = await admin
    .from("restaurant_tables")
    .select("id, label, restaurant_id")
    .eq("qr_token", qr_token)
    .single();

  if (tErr || !table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  // Insert into new service_requests table
  const { data: requestRecord, error: sErr } = await admin
    .from("service_requests")
    .insert({
      restaurant_id: table.restaurant_id,
      table_id: table.id,
      request_type,
      notes,
    })
    .select("id, status, created_at")
    .single();

  if (sErr || !requestRecord) {
    return NextResponse.json({ error: sErr?.message || "Failed to create request" }, { status: 500 });
  }

  // Create an audit notification event (append-only ledger)
  await admin.from("audit_events").insert({
    restaurant_id: table.restaurant_id,
    entity: "table_service",
    entity_id: table.id,
    action: request_type,
    metadata: {
      table_label: table.label,
      request_type,
      notes,
      request_id: requestRecord.id,
      created_at: new Date().toISOString(),
    },
  });

  // Broadcast to staff via Supabase Realtime
  await admin.channel(`table-service-alerts:${table.restaurant_id}`).send({
    type: "broadcast",
    event: "new_request",
    payload: {
      id: requestRecord.id,
      table_id: table.id,
      table_label: table.label,
      request_type,
      notes,
      status: requestRecord.status,
      created_at: requestRecord.created_at,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Service request dispatched for Table ${table.label}! Staff notified.`,
  });
}

