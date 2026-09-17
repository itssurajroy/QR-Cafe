// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";

type HealthData = {
  failedWebhooks: number;
  errorAudits: number;
  failedPayments: number;
  checked_at: string;
  subsystems: Array<{ name: string; status: string; ping: string }>;
};

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createSupabaseAdmin();
  const now = new Date().toISOString();

  // 1. Failed webhooks in last 24h - from audit_events
  const { count: failedWebhooks } = await db
    .from("audit_events")
    .select("id", { count: "exact" })
    .eq("action", "webhook_delivery_failed")
    .gte("created_at", new Date(Date.now() - 864e5).toISOString());

  // 2. Error audits in last 24h
  const { count: errorAudits } = await db
    .from("audit_events")
    .select("id", { count: "exact" })
    .ilike("action", "%error%")
    .gte("created_at", new Date(Date.now() - 864e5).toISOString());

  // 3. Failed payments in last 24h
  const { count: failedPayments } = await db
    .from("orders")
    .select("id", { count: "exact" })
    .eq("payment_status", "failed")
    .gte("created_at", new Date(Date.now() - 864e5).toISOString());

  // 4. Subsystem connectivity checks with real latency measurement
  const subsystems = [
    { name: "Supabase PostgreSQL", check: async () => {
      const start = Date.now();
      await db.from("restaurants").select("id").limit(1);
      return Date.now() - start;
    }},
    { name: "Supabase Storage", check: async () => {
      const start = Date.now();
      const { data } = await db.storage.from("images").list("", { limit: 1 });
      return Date.now() - start;
    }},
    { name: "Razorpay Webhooks", check: async () => {
      // Ping Razorpay health endpoint
      const start = Date.now();
      try {
        await fetch("https://api.razorpay.com/v1/ping", { signal: AbortSignal.timeout(5000) });
        return Date.now() - start;
      } catch {
        return -1;
      }
    }},
    { name: "Edge Realtime", check: async () => {
      // Supabase realtime ping
      const start = Date.now();
      try {
        await fetch("https://realtime.supabase.co/health", { signal: AbortSignal.timeout(3000) });
        return Date.now() - start;
      } catch {
        return -1;
      }
    }},
  ];

  const subsystemResults = await Promise.all(
    subsystems.map(async ({ name, check }) => {
      const latency = await check();
      return {
        name,
        status: latency >= 0 ? "Operational" : "Degraded",
        ping: latency >= 0 ? `${latency}ms` : "Timeout",
      };
    })
  );

  return NextResponse.json({
    ok: true,
    health: {
      failedWebhooks: failedWebhooks || 0,
      errorAudits: errorAudits || 0,
      failedPayments: failedPayments || 0,
      checked_at: now,
    },
    subsystems: subsystemResults,
  });
}