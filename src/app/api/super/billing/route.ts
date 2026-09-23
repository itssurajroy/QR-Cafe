// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { checkPlatformRateLimit } from "@/lib/rate-limit-platform";
import { escapeOrFilter } from "@/lib/platform-filter";
import { DEFAULT_MONTHLY_PAISE } from "@/lib/plan-pricing";

// Single-purpose duplication of the subscription state machine in
// src/lib/subscription-machine.test.ts — intentional per Task 8 brief.
const ALLOWED: Record<string, string[]> = {
  trial: ["active", "expired", "suspended", "cancelled"],
  active: ["suspended", "cancelled", "expired"],
  suspended: ["active", "cancelled"],
  expired: ["active", "cancelled"],
  cancelled: [],
};

function canTransition(from: string, to: string) {
  return (ALLOWED[from] ?? []).includes(to);
}

const ACTIVE_MRR_PAISE = DEFAULT_MONTHLY_PAISE;

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const status = (q.get("status") || "").trim();
  const search = (q.get("search") || "").trim();
  const db = createSupabaseAdmin();

  let rows: any[] = [];
  try {
    let query = db
      .from("restaurants")
      .select("id, name, slug, plan, subscription_status, trial_ends_at, mrr_cents")
      .order("trial_ends_at", { ascending: true });
    if (status) query = query.eq("subscription_status", status);
    if (search) query = query.or(`name.ilike.%${escapeOrFilter(search)}%,slug.ilike.%${escapeOrFilter(search)}%`);
    const { data, error } = await query;
    if (error) throw error;
    rows = data ?? [];
  } catch (e: any) {
    // mrr_cents column may not exist in the live DB yet — retry without it.
    if (String(e?.message ?? e).includes("mrr_cents")) {
      let query = db
        .from("restaurants")
        .select("id, name, slug, plan, subscription_status, trial_ends_at")
        .order("trial_ends_at", { ascending: true });
      if (status) query = query.eq("subscription_status", status);
      if (search) query = query.or(`name.ilike.%${escapeOrFilter(search)}%,slug.ilike.%${escapeOrFilter(search)}%`);
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      rows = (data ?? []).map((r: any) => ({
        ...r,
        mrr_cents: r.subscription_status === "active" || r.plan === "active" ? ACTIVE_MRR_PAISE : 0,
      }));
    } else {
      return NextResponse.json({ error: "Failed to list subscriptions" }, { status: 500 });
    }
  }

  // billing_events table may not exist in the live DB yet — degrade to [].
  let events: any[] = [];
  try {
    const { data, error } = await db
      .from("billing_events")
      .select("id, created_at, restaurant_id, provider, event_type, status, amount_paise, payload")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    events = data ?? [];
  } catch {
    events = [];
  }

  const mrr_paise = rows.reduce(
    (sum, r) =>
      sum + (typeof r.mrr_cents === "number" ? r.mrr_cents : r.subscription_status === "active" ? ACTIVE_MRR_PAISE : 0),
    0
  );
  return NextResponse.json({ ok: true, rows, events, mrr_paise });
}

const postSchema = z.object({
  restaurant_id: z.string().uuid(),
  to: z.enum(["trial", "active", "expired", "suspended", "cancelled"]),
  reason: z.string().min(5).max(500),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;

  const rl = checkPlatformRateLimit(user.userId, "billing.override", 20, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const db = createSupabaseAdmin();
  const { data: current, error: curErr } = await db
    .from("restaurants")
    .select("id, plan, subscription_status")
    .eq("id", input.restaurant_id)
    .maybeSingle();
  if (curErr || !current) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const from: string = (current as any).subscription_status ?? (current as any).plan ?? "trial";
  if (!canTransition(from, input.to)) {
    return NextResponse.json({ error: `Invalid transition from "${from}" to "${input.to}"` }, { status: 409 });
  }

  const patch = {
    plan: input.to,
    subscription_status: input.to,
    mrr_cents: input.to === "active" ? ACTIVE_MRR_PAISE : 0,
  };
  let { error: updErr } = await db.from("restaurants").update(patch).eq("id", input.restaurant_id);
  if (updErr && String(updErr.message).includes("mrr_cents")) {
    // mrr_cents column missing in live DB — update without it.
    const { plan, subscription_status } = patch;
    const retry = await db.from("restaurants").update({ plan, subscription_status }).eq("id", input.restaurant_id);
    updErr = retry.error;
  }
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // billing_events table may not exist in the live DB yet — never fail the transition.
  try {
    await db.from("billing_events").insert({
      restaurant_id: input.restaurant_id,
      provider: "manual",
      event_type: `subscription.${input.to}`,
      status: "received",
      amount_paise: input.to === "active" ? ACTIVE_MRR_PAISE : 0,
      payload: { from, to: input.to, reason: input.reason, actor: user.userId },
    });
  } catch {
    // degrade silently — audit row below is the durable record
  }

  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: input.restaurant_id,
    entity: "subscription",
    entity_id: input.restaurant_id,
    action: "subscription.changed",
    metadata: { from, to: input.to, reason: input.reason },
  });

  return NextResponse.json({ ok: true, restaurant_id: input.restaurant_id, from, to: input.to });
}
