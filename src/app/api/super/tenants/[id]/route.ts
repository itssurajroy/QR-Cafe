// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { planToSubscriptionStatus } from "@/lib/subscription";

const schema = z.object({
  op: z.enum(["suspend", "activate", "force_expire", "extend_trial", "set_fields"]),
  days: z.number().int().min(1).max(90).optional(),
  reason: z.string().max(300).optional(),
  plan: z.enum(["trial", "active"]).optional(),
  trial_ends_at: z.string().max(100).optional(),
  tier: z.string().max(50).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid op" }, { status: 422 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  const now = new Date().toISOString();
  let update: Record<string, unknown>;
  let auditAction = `super_${parsed.data.op}`;
  let auditMeta: Record<string, unknown> = {
    reason: parsed.data.reason ?? null,
    days: parsed.data.days ?? null,
  };
  if (parsed.data.op === "suspend") {
    update = { plan: "suspended", subscription_status: "suspended", is_suspended: true, suspended_at: now, suspended_reason: parsed.data.reason ?? null };
  } else if (parsed.data.op === "activate") {
    update = { plan: "active", subscription_status: "active", is_suspended: false, suspended_at: null, suspended_reason: null };
  } else if (parsed.data.op === "force_expire") {
    update = { plan: "trial", subscription_status: "expired", trial_ends_at: new Date(Date.now() - 1000).toISOString() };
  } else if (parsed.data.op === "extend_trial") {
    const days = parsed.data.days ?? 14;
    update = { plan: "trial", subscription_status: "trial", trial_ends_at: new Date(Date.now() + days * 864e5).toISOString(), is_suspended: false, suspended_at: null, suspended_reason: null };
  } else {
    const { data: current, error: cErr } = await db
      .from("restaurants")
      .select("plan, trial_ends_at")
      .eq("id", id)
      .maybeSingle();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if (!current) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    update = {};
    if (parsed.data.plan) update.plan = parsed.data.plan;
    if (parsed.data.trial_ends_at) update.trial_ends_at = parsed.data.trial_ends_at;
    if (parsed.data.tier) update.tier = parsed.data.tier;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 422 });
    }
    update.subscription_status = planToSubscriptionStatus(
      (update.plan as string | undefined) ?? (current as { plan: string }).plan,
      (update.trial_ends_at as string | undefined) ?? (current as { trial_ends_at: string | null }).trial_ends_at,
    );
    auditAction = "super_subscription_edit";
    auditMeta = { fields: update };
  }
  const { data, error } = await db.from("restaurants").update(update).eq("id", id).select("id, plan, subscription_status, trial_ends_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from("audit_events").insert({
    actor_id: user.userId, restaurant_id: id, entity: "tenant", entity_id: id,
    action: auditAction, metadata: auditMeta,
  });
  return NextResponse.json({ ok: true, tenant: data });
}
