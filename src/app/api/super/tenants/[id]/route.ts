// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { planToSubscriptionStatus } from "@/lib/subscription";
import { checkPlatformRateLimit } from "@/lib/rate-limit-platform";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  op: z.enum(["suspend", "activate", "force_expire", "expire", "extend_trial", "set_fields", "soft_delete", "hard_delete", "transfer"]),
  days: z.number().int().min(1).max(90).optional(),
  reason: z.string().max(300).optional(),
  plan: z.enum(["trial", "active"]).optional(),
  trial_ends_at: z.string().max(100).optional(),
  tier: z.string().max(50).optional(),
  slug: z.string().max(100).optional(),
  newOwnerEmail: z.string().email().max(200).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid op" }, { status: 422 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  const now = new Date().toISOString();

  const rl = checkPlatformRateLimit(user.userId, `tenant.${parsed.data.op}`, parsed.data.op === "hard_delete" ? 3 : 10);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

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
  } else if (parsed.data.op === "force_expire" || parsed.data.op === "expire") {
    update = { plan: "trial", subscription_status: "expired", trial_ends_at: new Date(Date.now() - 1000).toISOString() };
    auditAction = parsed.data.op === "expire" ? "super_expire" : "super_force_expire";
  } else if (parsed.data.op === "extend_trial") {
    const days = parsed.data.days ?? 14;
    update = { plan: "trial", subscription_status: "trial", trial_ends_at: new Date(Date.now() + days * 864e5).toISOString(), is_suspended: false, suspended_at: null, suspended_reason: null };
  } else if (parsed.data.op === "soft_delete") {
    update = { plan: "cancelled", subscription_status: "cancelled", is_suspended: true, suspended_at: now, suspended_reason: parsed.data.reason ?? "soft deleted by super admin" };
  } else if (parsed.data.op === "hard_delete") {
    const { data: current, error: cErr } = await db
      .from("restaurants")
      .select("id, slug, name")
      .eq("id", id)
      .maybeSingle();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if (!current) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    if (!parsed.data.slug || parsed.data.slug !== (current as { slug: string }).slug) {
      return NextResponse.json({ error: "Slug mismatch" }, { status: 422 });
    }
    const { error } = await db.from("restaurants").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(db, {
      actor_id: user.userId, restaurant_id: null, entity: "tenant", entity_id: id,
      action: "super_hard_delete", metadata: { slug: (current as { slug: string }).slug, name: (current as { name: string }).name },
    });
    return NextResponse.json({ ok: true, deleted: id });
  } else if (parsed.data.op === "transfer") {
    const email = parsed.data.newOwnerEmail?.toLowerCase().trim();
    if (!email) return NextResponse.json({ error: "newOwnerEmail required" }, { status: 422 });
    // Emails live only in auth.users — resolve the target user id via auth admin by email first (safe-failure order: resolve before any write).
    let targetUserId: string | null = null;
    try {
      for (let page = 1; page <= 10 && !targetUserId; page++) {
        const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
        if (error || !data?.users?.length) break;
        const match = data.users.find((u: any) => (u.email ?? "").toLowerCase() === email);
        if (match?.id) targetUserId = match.id;
        if (data.users.length < 1000) break;
      }
    } catch {
      targetUserId = null;
    }
    if (!targetUserId) return NextResponse.json({ error: "User not found for this email" }, { status: 404 });
    const { data: target, error: tErr } = await db
      .from("cafe_profiles")
      .select("id, role")
      .eq("id", targetUserId)
      .eq("restaurant_id", id)
      .maybeSingle();
    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
    if (!target) return NextResponse.json({ error: "New owner profile not found in this tenant" }, { status: 404 });
    const targetId = (target as { id: string }).id;
    const { data: owners } = await db
      .from("cafe_profiles")
      .select("id")
      .eq("restaurant_id", id)
      .eq("role", "owner");
    const ownerEmails: string[] = [];
    for (const o of owners ?? []) {
      const { data: u } = await db.auth.admin.getUserById((o as { id: string }).id);
      if (u?.user?.email) ownerEmails.push(u.user.email);
    }
    const { error: dErr } = await db
      .from("cafe_profiles")
      .update({ role: "manager" })
      .eq("restaurant_id", id)
      .eq("role", "owner")
      .neq("id", targetId);
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
    const { error: pErr } = await db
      .from("cafe_profiles")
      .update({ role: "owner", active: true })
      .eq("id", targetId);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    await logAudit(db, {
      actor_id: user.userId, restaurant_id: id, entity: "tenant", entity_id: id,
      action: "super_transfer",
      metadata: { from: ownerEmails, to: email },
    });
    return NextResponse.json({ ok: true, owner: email });
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
  await logAudit(db, {
    actor_id: user.userId, restaurant_id: id, entity: "tenant", entity_id: id,
    action: auditAction, metadata: auditMeta,
  });
  return NextResponse.json({ ok: true, tenant: data });
}
