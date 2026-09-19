// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Compute CRM analytics: aggregate campaign performance + loyalty metrics
  try {
    // Fetch all automations
    const { data: automations, error: autoErr } = await admin
      .from("crm_automations")
      .select("*")
      .eq("restaurant_id", user.restaurantId);

    if (autoErr) throw autoErr;

    // Fetch all rewards
    const { data: rewards, error: rewardsErr } = await admin
      .from("loyalty_rewards")
      .select("*")
      .eq("restaurant_id", user.restaurantId);

    if (rewardsErr) throw rewardsErr;

    // Fetch notification campaigns
    const { data: campaigns, error: campErr } = await admin
      .from("notification_campaigns")
      .select("*")
      .eq("restaurant_id", user.restaurantId);

    if (campErr) throw campErr;

    // Calculate summary stats
    const totalAutomations = automations?.length || 0;
    const activeAutomations = automations?.filter((a: any) => a.is_active).length || 0;
    const totalRewards = rewards?.length || 0;
    const activeRewards = rewards?.filter((r: any) => r.is_active).length || 0;
    const totalCampaigns = campaigns?.length || 0;
    const sentCampaigns = campaigns?.filter((c: any) => c.status === "sent").length || 0;

    // Total revenue from sent campaigns
    const totalRevenue = campaigns?.reduce((sum: number, c: any) => sum + (c.revenue_paise || 0), 0) || 0;

    // Total orders from sent campaigns
    const totalOrders = campaigns?.reduce((sum: number, c: any) => sum + (c.orders_count || 0), 0) || 0;

    // Total opened/clicked from sent campaigns
    const totalOpened = campaigns?.reduce((sum: number, c: any) => sum + (c.opened_count || 0), 0) || 0;
    const totalClicked = campaigns?.reduce((sum: number, c: any) => sum + (c.clicked_count || 0), 0) || 0;

    return NextResponse.json({
      automations: {
        total: totalAutomations,
        active: activeAutomations,
      },
      rewards: {
        total: totalRewards,
        active: activeRewards,
      },
      campaigns: {
        total: totalCampaigns,
        sent: sentCampaigns,
        totalRevenuePaise: totalRevenue,
        totalOrders: totalOrders,
        totalOpened: totalOpened,
        totalClicked: totalClicked,
      },
    });
  } catch (err: any) {
    console.error("[CRM Analytics] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}