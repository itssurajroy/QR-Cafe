// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

const VALID_SEGMENTS = [
  "all",
  "new",
  "returning",
  "vip",
  "inactive",
  "active",
  "high_spenders",
  "loyalty_members",
] as const;

type SegmentId = (typeof VALID_SEGMENTS)[number];

const REACHABLE_LIST_LIMIT = 500;

// Segment predicates — thresholds mirror the CrmTab UI and /api/admin/crm exactly.
function segmentPredicate(segment: SegmentId, sevenDaysAgo: string, thirtyDaysAgo: string) {
  switch (segment) {
    case "all":
      return () => true;
    case "new":
      return (c: any) => c.created_at >= sevenDaysAgo || c.visit_count <= 1;
    case "returning":
      return (c: any) => c.visit_count >= 2;
    case "vip":
      return (c: any) => (c.total_spent_paise || 0) >= 500000; // > ₹5,000
    case "inactive":
      return (c: any) => !!c.last_visit_at && c.last_visit_at <= thirtyDaysAgo; // > 30 days
    case "active":
      return (c: any) => c.visit_count >= 3 && c.last_visit_at >= thirtyDaysAgo;
    case "high_spenders":
      return (c: any) => c.visit_count > 0 && (c.total_spent_paise || 0) / c.visit_count >= 100000; // AOV > ₹1,000
    case "loyalty_members":
      return (c: any) => (c.loyalty_points || 0) > 0;
  }
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const segmentParam = searchParams.get("segment") || "all";
  const segment = (VALID_SEGMENTS as readonly string[]).includes(segmentParam)
    ? (segmentParam as SegmentId)
    : "all";

  const db = createSupabaseAdmin();
  const tenantId = user.restaurantId;

  const { data: allCustomers, error: fetchErr } = await db
    .from("restaurant_customers")
    .select("id, name, phone, total_spent_paise, visit_count, last_visit_at, loyalty_points, created_at")
    .eq("restaurant_id", tenantId);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const list = allCustomers || [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();

  // Counts for all 8 segments
  const counts: Record<SegmentId, number> = {
    all: list.length,
    new: list.filter(segmentPredicate("new", sevenDaysAgo, thirtyDaysAgo)).length,
    returning: list.filter(segmentPredicate("returning", sevenDaysAgo, thirtyDaysAgo)).length,
    vip: list.filter(segmentPredicate("vip", sevenDaysAgo, thirtyDaysAgo)).length,
    inactive: list.filter(segmentPredicate("inactive", sevenDaysAgo, thirtyDaysAgo)).length,
    active: list.filter(segmentPredicate("active", sevenDaysAgo, thirtyDaysAgo)).length,
    high_spenders: list.filter(segmentPredicate("high_spenders", sevenDaysAgo, thirtyDaysAgo)).length,
    loyalty_members: list.filter(segmentPredicate("loyalty_members", sevenDaysAgo, thirtyDaysAgo)).length,
  };

  // WhatsApp-reachable phones for the requested segment: marketing opt-in required.
  let reachable: Array<{ phone: string; opt_in_type: string }> = [];
  if (segment !== "all") {
    const { data: optIns, error: optInErr } = await db
      .from("whatsapp_opt_ins")
      .select("phone, opt_in_type")
      .eq("tenant_id", tenantId)
      .eq("status", "confirmed")
      .in("opt_in_type", ["marketing", "both"]);

    if (optInErr) {
      return NextResponse.json({ error: optInErr.message }, { status: 500 });
    }

    const optInMap = new Map<string, string>();
    for (const o of optIns || []) {
      optInMap.set(o.phone, o.opt_in_type);
    }

    reachable = list
      .filter(segmentPredicate(segment, sevenDaysAgo, thirtyDaysAgo))
      .filter((c: any) => c.phone && optInMap.has(c.phone))
      .slice(0, REACHABLE_LIST_LIMIT)
      .map((c: any) => ({
        phone: c.phone,
        opt_in_type: optInMap.get(c.phone) || "marketing",
      }));
  }

  return NextResponse.json({
    counts,
    reachable,
    segment,
  });
}
