// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTrialEmail, type TrialEmailDay } from "@/lib/email";

export const dynamic = "force-dynamic";

const DAY = 864e5;

type Milestone = { day: TrialEmailDay; match: (ageDays: number, expired: boolean) => boolean };

const MILESTONES: Milestone[] = [
  { day: 0, match: (age) => age < 2 },
  { day: 7, match: (age) => age >= 7 && age < 8 },
  { day: 12, match: (age) => age >= 12 && age < 13 },
  { day: 14, match: (age, expired) => age >= 14 || expired },
];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const now = Date.now();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";

  const { data: cafes, error } = await db
    .from("restaurants")
    .select("id, name, slug, plan, trial_starts_at, trial_ends_at")
    .eq("plan", "trial");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ cafe: string; day: number; sent: boolean; note?: string }> = [];

  for (const cafe of cafes ?? []) {
    // Anchor: trial_starts_at, else infer from trial_ends_at minus 14 days.
    const startMs = cafe.trial_starts_at
      ? new Date(cafe.trial_starts_at).getTime()
      : cafe.trial_ends_at
        ? new Date(cafe.trial_ends_at).getTime() - 14 * DAY
        : null;
    if (!startMs) continue;

    const ageDays = Math.floor((now - startMs) / DAY);
    const expired = cafe.trial_ends_at ? new Date(cafe.trial_ends_at).getTime() <= now : ageDays >= 14;
    const milestone = MILESTONES.find((m) => m.match(ageDays, expired));
    if (!milestone) continue;

    // Dedup: one email per milestone per café.
    const { data: logged } = await db
      .from("audit_events")
      .select("id")
      .eq("restaurant_id", cafe.id)
      .eq("entity", "trial_email")
      .eq("action", `day${milestone.day}`)
      .limit(1)
      .maybeSingle();
    if (logged) continue;

    // Resolve owner email.
    const { data: owner } = await db
      .from("cafe_profiles")
      .select("id")
      .eq("restaurant_id", cafe.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    let email: string | null = null;
    if (owner) {
      const { data: user } = await db.auth.admin.getUserById(owner.id);
      email = user?.user?.email ?? null;
    }
    if (!email) {
      results.push({ cafe: cafe.slug, day: milestone.day, sent: false, note: "no-owner-email" });
      continue;
    }

    // Light usage stats for the Day 7 email.
    let ordersCount: number | undefined;
    let revenuePaise: number | undefined;
    if (milestone.day === 7) {
      const { data: orders } = await db
        .from("orders")
        .select("total_paise, payment_status")
        .eq("restaurant_id", cafe.id)
        .gte("created_at", new Date(startMs).toISOString());
      const paid = (orders ?? []).filter((o) => o.payment_status === "paid");
      ordersCount = (orders ?? []).length;
      revenuePaise = paid.reduce((s, o) => s + (o.total_paise || 0), 0);
    }

    const daysLeft = cafe.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(cafe.trial_ends_at).getTime() - now) / DAY))
      : 0;
    const { sent, skipped } = await sendTrialEmail(email, milestone.day, {
      cafeName: cafe.name,
      daysLeft,
      ordersCount,
      revenuePaise,
      billingUrl: `${appUrl}/admin/billing`,
    });

    await db.from("audit_events").insert({
      restaurant_id: cafe.id,
      entity: "trial_email",
      entity_id: cafe.id,
      action: `day${milestone.day}`,
      metadata: { to: email, sent, skipped: skipped ?? null },
    });
    results.push({ cafe: cafe.slug, day: milestone.day, sent, note: skipped });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

