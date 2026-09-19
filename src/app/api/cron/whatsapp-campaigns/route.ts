// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { enqueueDueWinBackCampaigns } from "@/workers/campaign.worker";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const secret = req.headers.get("authorization");
  if (!secret || secret !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const result = await enqueueDueWinBackCampaigns(db);

  return NextResponse.json({
    ok: true,
    enqueued: result.enqueued,
    skipped: result.skipped,
    details: result.details,
  });
}