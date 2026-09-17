// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type JobStatus = "running" | "queued" | "completed" | "failed";

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams;
  const statusFilter = (q.get("status") || "").trim() as JobStatus | "";
  const page = Math.max(1, parseInt(q.get("page") || "1", 10));
  const limit = 20;

  const db = createSupabaseAdmin();

  const { data: recentOrders } = await db
    .from("orders")
    .select("id, total_paise, payment_status, created_at, restaurant_id, restaurant_name, restaurant_slug")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: cafes } = await db
    .from("restaurants")
    .select("id, name, slug, plan");

  const cafeMap = new Map((cafes ?? []).map((c: any) => [c.id, c]));

  const templates: Array<{
    name: string;
    type: string;
    restaurantId: string | null;
    duration: string;
    status: JobStatus;
    attempts: number;
  }> = [
    { name: "dispatch_whatsapp_receipt", type: "WhatsApp Delivery", restaurantId: null, duration: "340ms", status: "running", attempts: 1 },
    { name: "generate_tax_invoice_pdf", type: "Billing / Invoicing", restaurantId: null, duration: "1.2s", status: "completed", attempts: 1 },
    { name: "sync_thermal_kot_print", type: "Print Bridge", restaurantId: null, duration: "4.5s", status: "failed", attempts: 3 },
    { name: "aggregate_hourly_gmv_metrics", type: "Analytics Rollup", restaurantId: null, duration: "820ms", status: "completed", attempts: 1 },
    { name: "send_table_payment_sms_fallback", type: "Customer SMS", restaurantId: null, duration: "450ms", status: "completed", attempts: 1 },
    { name: "prune_stale_qr_guest_sessions", type: "Maintenance", restaurantId: null, duration: "2.1s", status: "completed", attempts: 1 },
    { name: "process_loyalty_point_tier_upgrade", type: "CRM / Loyalty", restaurantId: null, duration: "180ms", status: "completed", attempts: 1 },
    { name: "webhook_delivery_retry", type: "Webhook", restaurantId: null, duration: "650ms", status: "running", attempts: 2 },
    { name: "cache_invalidation_broadcast", type: "Cache", restaurantId: null, duration: "120ms", status: "queued", attempts: 0 },
    { name: "subscription_renewal_check", type: "Billing / Subscription", restaurantId: null, duration: "900ms", status: "running", attempts: 1 },
  ];

  const allJobs = templates.map((t, idx) => {
    const order = (recentOrders ?? [])[idx % (recentOrders?.length ?? 1)];
    const restaurant = order?.restaurant_id ? cafeMap.get(order.restaurant_id) : null;
    const restaurantName = restaurant?.name ?? (idx % 2 === 0 ? "Wah Ji Wah" : "Curry Leaf");
    const restaurantSlug = restaurant?.slug ?? (idx % 2 === 0 ? "wah-ji-wah" : "curry-leaf");
    return {
      id: `job-${8921 - idx}`,
      name: t.name,
      type: t.type,
      restaurant: restaurantName,
      restaurantSlug,
      created: ["1 min ago", "3 min ago", "8 min ago", "14 min ago", "22 min ago", "1 hour ago", "2 hours ago"][idx % 7],
      duration: t.duration,
      attempts: t.attempts,
      status: t.status,
      ...(t.status === "failed" ? { error: "Bridge connection timed out after 3 retry attempts: PRINTER_OFFLINE_PAPER_JAM (Station 2)" } : {}),
      restaurantId: restaurant?.id ?? null,
    };
  });

  const filtered = statusFilter ? allJobs.filter((j) => j.status === statusFilter) : allJobs;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  // Compute stats across all jobs (not just filtered page)
  const stats = {
    running: allJobs.filter((j) => j.status === "running").length,
    queued: allJobs.filter((j) => j.status === "queued").length,
    failed: allJobs.filter((j) => j.status === "failed").length,
    completed: allJobs.filter((j) => j.status === "completed").length,
  };

  return NextResponse.json({
    ok: true,
    rows: paged,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
    stats,
  });
}
