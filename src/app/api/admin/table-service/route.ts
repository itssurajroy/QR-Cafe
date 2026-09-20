// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  
  // Fetch pending requests for the restaurant
  const { data: requests, error } = await admin
    .from("service_requests")
    .select("id, table_id, request_type, notes, status, created_at, restaurant_tables(label)")
    .eq("restaurant_id", auth.restaurantId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = requests.map((r: any) => ({
    id: r.id,
    table_id: r.table_id,
    table_label: r.restaurant_tables?.label || "Unknown Table",
    request_type: r.request_type,
    notes: r.notes,
    status: r.status,
    created_at: r.created_at,
  }));

  return NextResponse.json({ ok: true, requests: mapped });
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Mark as completed
  const { error } = await admin
    .from("service_requests")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("restaurant_id", auth.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record acknowledgment in audit
  await admin.from("audit_events").insert({
    restaurant_id: auth.restaurantId,
    actor_id: auth.userId,
    entity: "table_service",
    entity_id: id,
    action: "acknowledged",
  });

  return NextResponse.json({ ok: true });
}
