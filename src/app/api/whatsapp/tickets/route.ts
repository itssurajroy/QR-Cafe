// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("whatsapp_tickets")
    .select("*")
    .eq("tenant_id", auth.restaurantId)
    .order("last_message_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: string | null = req.nextUrl.searchParams.get("id");

  let body: unknown = null;
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore parse error, will be validated below
  }

  if (!id && body && typeof body === "object" && body !== null && "id" in body) {
    const maybe = (body as Record<string, unknown>).id;
    if (typeof maybe === "string" && maybe.trim()) id = maybe.trim();
  }

  // also support { ticketId }
  if (!id && body && typeof body === "object" && body !== null && "ticketId" in body) {
    const maybe = (body as Record<string, unknown>).ticketId;
    if (typeof maybe === "string" && maybe.trim()) id = maybe.trim();
  }

  if (!id) {
    return NextResponse.json({ error: "Missing ticket id" }, { status: 422 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("whatsapp_tickets")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("tenant_id", auth.restaurantId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ticket: data });
}
