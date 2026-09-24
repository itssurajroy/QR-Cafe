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

  const customerJid = req.nextUrl.searchParams.get("customer_jid") ?? req.nextUrl.searchParams.get("customerJid") ?? req.nextUrl.searchParams.get("jid");

  if (!customerJid || !customerJid.trim()) {
    return NextResponse.json({ error: "customer_jid is required" }, { status: 422 });
  }

  const jid = customerJid.trim();
  const phone = jid.split("@")[0].split(":")[0];

  const db = createSupabaseAdmin();

  const inboundQuery = db
    .from("whatsapp_inbound_messages")
    .select("*")
    .eq("tenant_id", auth.restaurantId)
    .eq("remote_jid", jid)
    .order("received_at", { ascending: true });

  const outboundQuery = db
    .from("whatsapp_messages")
    .select("*")
    .eq("tenant_id", auth.restaurantId)
    .eq("recipient_phone", phone)
    .order("created_at", { ascending: true });

  const [{ data: inbound, error: inboundError }, { data: outbound, error: outboundError }] = await Promise.all([
    inboundQuery as unknown as Promise<{ data: unknown[] | null; error: { message: string } | null }>,
    outboundQuery as unknown as Promise<{ data: unknown[] | null; error: { message: string } | null }>,
  ]);

  if (inboundError) {
    return NextResponse.json({ error: inboundError.message }, { status: 500 });
  }
  if (outboundError) {
    return NextResponse.json({ error: outboundError.message }, { status: 500 });
  }

  type Msg = { direction: "inbound" | "outbound"; timestamp: string; raw: unknown };

  const inboundMapped: Msg[] = (inbound ?? []).map((row: unknown) => {
    const r = row as Record<string, unknown>;
    const ts = (r.received_at as string) ?? (r.created_at as string) ?? new Date(0).toISOString();
    return { direction: "inbound" as const, timestamp: ts, raw: r };
  });

  const outboundMapped: Msg[] = (outbound ?? []).map((row: unknown) => {
    const r = row as Record<string, unknown>;
    const ts = (r.created_at as string) ?? (r.sent_at as string) ?? (r.scheduled_at as string) ?? new Date(0).toISOString();
    return { direction: "outbound" as const, timestamp: ts, raw: r };
  });

  const messages = [...inboundMapped, ...outboundMapped].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Return both the union-sorted messages and the raw partitions for UI flexibility
  return NextResponse.json({ messages, inbound: inbound ?? [], outbound: outbound ?? [] });
}
