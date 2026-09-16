// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  try {
    const nowWithBuffer = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    // Fetch announcements that have started (with small 5-min clock tolerance)
    // and haven't expired yet.
    let query = db
      .from("platform_announcements")
      .select("id, title, body, target_plan, starts_at, ends_at, created_at")
      .lte("starts_at", nowWithBuffer)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
      .order("starts_at", { ascending: false });

    if (user.role !== "super_admin") {
      let tenantPlan = "trial";
      if (user.restaurantId) {
        const { data: rest } = await db
          .from("restaurants")
          .select("subscription_status, plan")
          .eq("id", user.restaurantId)
          .maybeSingle();
        if (rest) {
          tenantPlan = rest.subscription_status || rest.plan || "trial";
        }
      }

      // Restrict: only broadcast ('all' or null), or announcements targeted at this tenant's plan status or role
      query = query.or(`target_plan.is.null,target_plan.eq.all,target_plan.eq.${tenantPlan},target_plan.eq.${user.role}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Check if there is an active global_broadcast from Super Admin Broadcast tab
    let broadcastNotification: any = null;
    try {
      const { data: configRow } = await db
        .from("platform_config")
        .select("value")
        .eq("key", "global_broadcast")
        .maybeSingle();

      const b = configRow?.value;
      if (b && b.active && b.subject) {
        broadcastNotification = {
          id: `broadcast-${b.sent_at || "live"}`,
          title: b.subject,
          body: b.message || "",
          type: b.type || "danger",
          target_plan: "all",
          starts_at: b.sent_at || new Date().toISOString(),
          ends_at: null,
          created_at: b.sent_at || new Date().toISOString(),
          is_broadcast: true,
        };
      }
    } catch {
      // ignore
    }

    // Deduplicate if broadcast was also copied to platform_announcements
    const existingIds = new Set((data ?? []).map((n) => n.id));
    const list = broadcastNotification
      ? [
          broadcastNotification,
          ...(data ?? []).filter(
            (n) => n.title !== broadcastNotification.title
          ),
        ]
      : data ?? [];

    return NextResponse.json({ ok: true, notifications: list });
  } catch (err: unknown) {
    console.error("Failed to fetch notifications:", err);
    return NextResponse.json({ ok: true, notifications: [] });
  }
}
