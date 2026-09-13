import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  // Rollout columns may not exist live yet (migration committed but not applied) — degrade gracefully.
  const full = await db
    .from("feature_flags")
    .select("key, enabled, description, rollout_pct, allow_list, updated_at")
    .order("key", { ascending: true });
  if (!full.error) return NextResponse.json({ ok: true, flags: full.data ?? [] });
  const legacy = await db
    .from("feature_flags")
    .select("key, enabled, description, updated_at")
    .order("key", { ascending: true });
  if (legacy.error) return NextResponse.json({ error: legacy.error.message }, { status: 500 });
  return NextResponse.json({
    ok: true,
    flags: (legacy.data ?? []).map((f) => ({ ...f, rollout_pct: 100, allow_list: [] })),
  });
}

const postSchema = z.object({
  key: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  enabled: z.boolean(),
  description: z.string().max(200).optional(),
  rollout_pct: z.number().int().min(0).max(100).default(100),
  allow_list: z.array(z.string().uuid()).default([]),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;
  const db = createSupabaseAdmin();
  const row: Record<string, unknown> = {
    key: input.key,
    enabled: input.enabled,
    description: input.description ?? "",
    rollout_pct: input.rollout_pct,
    allow_list: input.allow_list,
    updated_at: new Date().toISOString(),
  };
  let flag: Record<string, unknown> | null = null;
  let upsertError: { message: string } | null = null;
  const full = await db
    .from("feature_flags")
    .upsert(row, { onConflict: "key" })
    .select("key, enabled, description, rollout_pct, allow_list, updated_at")
    .single();
  if (full.error) {
    // Rollout columns may not exist live yet — fall back to the legacy shape.
    const legacyRow = {
      key: row.key,
      enabled: row.enabled,
      description: row.description,
      updated_at: row.updated_at,
    };
    const legacy = await db
      .from("feature_flags")
      .upsert(legacyRow, { onConflict: "key" })
      .select("key, enabled, description, updated_at")
      .single();
    upsertError = legacy.error;
    flag = legacy.data as Record<string, unknown> | null;
  } else {
    flag = full.data as Record<string, unknown> | null;
  }
  if (upsertError || !flag) return NextResponse.json({ error: upsertError?.message || "Upsert failed" }, { status: 500 });
  await db.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: null,
    entity: "flag",
    entity_id: input.key,
    action: "super_flag_change",
    metadata: { key: input.key, enabled: input.enabled, rollout_pct: input.rollout_pct, allow_list: input.allow_list },
  });
  return NextResponse.json({ ok: true, flag });
}
