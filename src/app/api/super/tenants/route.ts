// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const TRIAL_DAYS_FALLBACK = 14;

async function trialDays(db: ReturnType<typeof createSupabaseAdmin>): Promise<number> {
  const { data } = await db.from("platform_config").select("value").eq("key", "trial_days").maybeSingle();
  const n = Number((data?.value as any)?.days);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : TRIAL_DAYS_FALLBACK;
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const search = (q.get("q") || "").trim();
  const status = (q.get("status") || "").trim();
  const page = Math.max(1, parseInt(q.get("page") || "1", 10));
  const limit = 15;
  const db = createSupabaseAdmin();
  let query = db.from("restaurants").select("id, name, slug, plan, tier, trial_ends_at, created_at", { count: "exact" }).order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  if (status) query = query.eq("plan", status);
  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (data ?? []).map((r) => r.id);
  let owners: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: profiles } = await db.from("cafe_profiles").select("id, restaurant_id").eq("role", "owner").in("restaurant_id", ids);
    for (const p of profiles ?? []) {
      const { data: u } = await db.auth.admin.getUserById(p.id);
      if (u?.user?.email && p.restaurant_id) owners[p.restaurant_id] = u.user.email;
    }
  }
  return NextResponse.json({
    ok: true,
    rows: (data ?? []).map((r) => ({ ...r, owner_email: owners[r.id] ?? null })),
    total: count ?? 0,
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  owner_name: z.string().min(2).max(100),
  owner_email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;
  const db = createSupabaseAdmin();
  const days = await trialDays(db);
  const now = new Date();

  const { data: existing } = await db.from("restaurants").select("id").eq("slug", input.slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });

  const { data: rest, error: rErr } = await db.from("restaurants").insert({
    name: input.name.trim(), slug: input.slug, plan: "trial", tier: "pro",
    subscription_status: "trial", trial_starts_at: now.toISOString(),
    trial_ends_at: new Date(now.getTime() + days * 864e5).toISOString(),
    created_by: user.userId,
  }).select("id, slug").single();
  if (rErr || !rest) return NextResponse.json({ error: rErr?.message || "Create failed" }, { status: 500 });

  const { data: authUser, error: uErr } = await db.auth.admin.createUser({
    email: input.owner_email.toLowerCase().trim(), email_confirm: true,
    user_metadata: { display_name: input.owner_name.trim() },
  });
  if (uErr || !authUser?.user) {
    await db.from("restaurants").delete().eq("id", rest.id);
    return NextResponse.json({ error: uErr?.message || "Owner creation failed" }, { status: 500 });
  }
  const { error: pErr } = await db.from("cafe_profiles").upsert({
    id: authUser.user.id, restaurant_id: rest.id, role: "owner",
    display_name: input.owner_name.trim(), active: true,
  });
  if (pErr) {
    await db.from("restaurants").delete().eq("id", rest.id);
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  await db.from("audit_events").insert({
    actor_id: user.userId, restaurant_id: rest.id, entity: "tenant", entity_id: rest.id,
    action: "super_create_tenant", metadata: { name: input.name, slug: input.slug, owner_email: input.owner_email, trial_days: days },
  });
  return NextResponse.json({ ok: true, id: rest.id, slug: rest.slug }, { status: 201 });
}

