// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  try {
    const [{ count: failedWebhooks }, { count: errorAudits }, { count: failedPayments }] = await Promise.all([
      db.from("billing_events").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
      db.from("audit_events").select("id", { count: "exact", head: true }).ilike("action", "%error%").gte("created_at", since),
      db.from("billing_events").select("id", { count: "exact", head: true }).eq("event_type", "payment.failed").gte("created_at", since),
    ]);
    return NextResponse.json({ ok: true, health: { failedWebhooks: failedWebhooks ?? 0, errorAudits: errorAudits ?? 0, failedPayments: failedPayments ?? 0, checked_at: new Date().toISOString() } });
  } catch {
    return NextResponse.json({ ok: true, health: { failedWebhooks: 0, errorAudits: 0, failedPayments: 0, checked_at: new Date().toISOString() } });
  }
}
