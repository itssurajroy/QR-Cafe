import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  const { data, error } = await db.from("platform_config").select("key, value, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const config: Record<string, unknown> = {};
  for (const row of data ?? []) {
    config[row.key] = (row as { value: unknown }).value;
  }
  return NextResponse.json({ ok: true, config });
}

const putSchema = z.object({
  trial_days: z.number().int().min(1).max(90).optional(),
  price_monthly: z.number().int().min(0).optional(),
  price_yearly: z.number().int().min(0).optional(),
  maintenance_mode: z.boolean().optional(),
});

async function upsertConfig(
  db: ReturnType<typeof createSupabaseAdmin>,
  key: string,
  value: Record<string, unknown>,
  actorId: string
) {
  const { data: existing } = await db.from("platform_config").select("key").eq("key", key).maybeSingle();
  const now = new Date().toISOString();
  if (existing) {
    const { error } = await db
      .from("platform_config")
      .update({ value, updated_at: now, updated_by: actorId })
      .eq("key", key);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db
      .from("platform_config")
      .insert({ key, value, updated_at: now, updated_by: actorId });
    if (error) throw new Error(error.message);
  }
  await db.from("audit_events").insert({
    actor_id: actorId,
    restaurant_id: null,
    entity: "platform",
    entity_id: key,
    action: "super_platform_config",
    metadata: { key },
  });
}

export async function PUT(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;
  if (
    input.trial_days === undefined &&
    input.price_monthly === undefined &&
    input.price_yearly === undefined &&
    input.maintenance_mode === undefined
  ) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const db = createSupabaseAdmin();
  try {
    if (input.trial_days !== undefined) {
      await upsertConfig(db, "trial_days", { days: input.trial_days }, user.userId);
    }
    if (input.price_monthly !== undefined || input.price_yearly !== undefined) {
      const { data: pricesRow } = await db
        .from("platform_config")
        .select("value")
        .eq("key", "prices")
        .maybeSingle();
      const old =
        pricesRow?.value && typeof pricesRow.value === "object"
          ? (pricesRow.value as Record<string, unknown>)
          : {};
      const next = { ...old };
      if (input.price_monthly !== undefined) next.monthly = input.price_monthly;
      if (input.price_yearly !== undefined) next.yearly = input.price_yearly;
      await upsertConfig(db, "prices", next, user.userId);
    }
    if (input.maintenance_mode !== undefined) {
      const { data: mmRow } = await db
        .from("platform_config")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      const old =
        mmRow?.value && typeof mmRow.value === "object"
          ? (mmRow.value as Record<string, unknown>)
          : {};
      await upsertConfig(db, "maintenance_mode", { ...old, enabled: input.maintenance_mode }, user.userId);
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
