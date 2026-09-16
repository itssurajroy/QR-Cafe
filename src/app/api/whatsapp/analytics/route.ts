// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const isSuperAdmin = user.role === "super_admin";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // If super admin, fetch global platform telemetry + restaurant leaderboard
  if (isSuperAdmin) {
    const { data: events, error } = await db
      .from("whatsapp_bill_events")
      .select("id, restaurant_id, event_type, created_at")
      .gte("created_at", thirtyDaysAgo);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: restaurants } = await db
      .from("restaurants")
      .select("id, name, slug");

    const restMap = new Map((restaurants || []).map((r) => [r.id, r]));

    let sent_7d = 0;
    let sent_30d = 0;
    let viewed_7d = 0;
    let viewed_30d = 0;
    let review_clicked_7d = 0;
    let review_clicked_30d = 0;
    let feedback_submitted_7d = 0;
    let feedback_submitted_30d = 0;

    const restStats: Record<string, { sent_30d: number; viewed_30d: number; review_clicked_30d: number }> = {};

    for (const ev of events || []) {
      const is7d = ev.created_at >= sevenDaysAgo;
      const rId = ev.restaurant_id;

      if (!restStats[rId]) {
        restStats[rId] = { sent_30d: 0, viewed_30d: 0, review_clicked_30d: 0 };
      }

      switch (ev.event_type) {
        case "sent":
          sent_30d++;
          restStats[rId].sent_30d++;
          if (is7d) sent_7d++;
          break;
        case "receipt_viewed":
          viewed_30d++;
          restStats[rId].viewed_30d++;
          if (is7d) viewed_7d++;
          break;
        case "review_clicked":
          review_clicked_30d++;
          restStats[rId].review_clicked_30d++;
          if (is7d) review_clicked_7d++;
          break;
        case "feedback_submitted":
          feedback_submitted_30d++;
          if (is7d) feedback_submitted_7d++;
          break;
      }
    }

    // Conversion rates with small-denominator guards
    const view_rate_7d = sent_7d >= 5 ? Math.round((viewed_7d / sent_7d) * 100) : null;
    const review_click_rate_7d = viewed_7d >= 5 ? Math.round((review_clicked_7d / viewed_7d) * 100) : null;

    // Leaderboard sorted by 30d volume
    const leaderboard = Object.entries(restStats)
      .map(([id, stats]) => ({
        restaurant_id: id,
        name: restMap.get(id)?.name || "Unknown Café",
        slug: restMap.get(id)?.slug || "",
        sent: stats.sent_30d,
        views: stats.viewed_30d,
        reviews: stats.review_clicked_30d,
        view_rate: stats.sent_30d > 0 ? Math.round((stats.viewed_30d / stats.sent_30d) * 100) : 0,
      }))
      .filter((r) => r.sent > 0)
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 10);

    return NextResponse.json({
      scope: "global",
      metrics: {
        sent_7d,
        sent_30d,
        viewed_7d,
        viewed_30d,
        review_clicked_7d,
        review_clicked_30d,
        feedback_submitted_7d,
        feedback_submitted_30d,
        view_rate_7d,
        review_click_rate_7d,
      },
      leaderboard,
    });
  }

  // Tenant-scoped analytics
  const restaurantId = user.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant attached to user" }, { status: 400 });
  }

  const { data: events, error } = await db
    .from("whatsapp_bill_events")
    .select("event_type, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", thirtyDaysAgo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent_7d = 0;
  let sent_30d = 0;
  let viewed_7d = 0;
  let viewed_30d = 0;
  let review_clicked_7d = 0;
  let review_clicked_30d = 0;

  for (const ev of events || []) {
    const is7d = ev.created_at >= sevenDaysAgo;
    if (ev.event_type === "sent") {
      sent_30d++;
      if (is7d) sent_7d++;
    } else if (ev.event_type === "receipt_viewed") {
      viewed_30d++;
      if (is7d) viewed_7d++;
    } else if (ev.event_type === "review_clicked") {
      review_clicked_30d++;
      if (is7d) review_clicked_7d++;
    }
  }

  const view_rate_7d = sent_7d >= 5 ? Math.round((viewed_7d / sent_7d) * 100) : null;
  const review_click_rate_7d = viewed_7d >= 5 ? Math.round((review_clicked_7d / viewed_7d) * 100) : null;

  return NextResponse.json({
    scope: "tenant",
    metrics: {
      sent_7d,
      sent_30d,
      viewed_7d,
      viewed_30d,
      review_clicked_7d,
      review_clicked_30d,
      view_rate_7d,
      review_click_rate_7d,
    },
  });
}
