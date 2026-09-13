// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
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

  const admin = createSupabaseAdmin();
  const { data: table, error: tErr } = await admin
    .from("restaurant_tables")
    .select("id, label, restaurant_id")
    .eq("qr_token", qr_token)
    .single();

  if (tErr || !table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  // Create an audit/service notification event
  const { error: aErr } = await admin.from("audit_events").insert({
    restaurant_id: table.restaurant_id,
    entity: "table_service",
    entity_id: table.id,
    action: request_type,
    metadata: {
      table_label: table.label,
      request_type,
      notes,
      created_at: new Date().toISOString(),
    },
  });

  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `Service request dispatched for Table ${table.label}! Staff notified.`,
  });
}

