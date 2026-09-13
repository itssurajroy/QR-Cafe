// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// QRslice super-admin settings store (Task-1 platform_settings).
// Legacy platform_config readers elsewhere stay untouched; only a read-only
// backfill read of platform_config.trial_days happens below.
type SettingsMap = Record<string, Record<string, unknown>>;

const DEFAULT_SETTINGS: SettingsMap = {
  trial_days: { days: 14 },
  pricing: { monthly_inr: 999, annual_inr: 9999 },
  signups_open: { enabled: true },
  maintenance: { enabled: false, message: "" },
};
const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

type AdminDb = ReturnType<typeof createSupabaseAdmin>;

async function readSettings(db: AdminDb): Promise<{ settings: SettingsMap; storedKeys: Set<string> }> {
  // Task-1 tables may not exist live yet — degrade to defaults, never crash.
  let rows: Array<{ key: string; value: unknown }> | null = null;
  try {
    const res = await db.from("platform_settings").select("key, value");
    if (!res.error) rows = (res.data ?? []) as Array<{ key: string; value: unknown }>;
  } catch {
    rows = null;
  }
  const settings: SettingsMap = {};
  for (const k of SETTING_KEYS) settings[k] = { ...DEFAULT_SETTINGS[k] };
  for (const row of rows ?? []) {
    if (SETTING_KEYS.includes(row.key) && row.value && typeof row.value === "object") {
      settings[row.key] = { ...DEFAULT_SETTINGS[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  return { settings, storedKeys: new Set((rows ?? []).map((r) => r.key)) };
}

async function upsertSetting(db: AdminDb, key: string, value: Record<string, unknown>, actorId: string) {
  const { error } = await db
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  await db.from("audit_events").insert({
    actor_id: actorId,
    restaurant_id: null,
    entity: "platform",
    entity_id: key,
    action: "super_platform_config",
    metadata: { key },
  });
}

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  const { settings, storedKeys } = await readSettings(db);
  // Backfill missing keys from legacy platform_config equivalents (read-only read).
  // Only trial_days exists there today.
  if (!storedKeys.has("trial_days")) {
    try {
      const { data } = await db.from("platform_config").select("value").eq("key", "trial_days").maybeSingle();
      const days = (data?.value as { days?: unknown } | null)?.days;
      if (typeof days === "number" && Number.isInteger(days) && days >= 1 && days <= 90) {
        settings.trial_days = { days };
        try {
          await upsertSetting(db, "trial_days", { days }, user.userId);
        } catch {
          // Live platform_settings may be missing — response still carries the value.
        }
      }
    } catch {
      // Legacy read failed — defaults stand.
    }
  }
  return NextResponse.json({ ok: true, settings });
}

const postSchema = z.object({
  trial_days: z.number().int().min(1).max(90).optional(),
  pricing: z
    .object({
      monthly_inr: z.number().int().min(0).optional(),
      annual_inr: z.number().int().min(0).optional(),
    })
    .optional(),
  signups_open: z.boolean().optional(),
  maintenance: z
    .object({
      enabled: z.boolean().optional(),
      message: z.string().max(500).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;
  if (
    input.trial_days === undefined &&
    input.pricing === undefined &&
    input.signups_open === undefined &&
    input.maintenance === undefined
  ) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const db = createSupabaseAdmin();
  try {
    const { settings } = await readSettings(db);
    if (input.trial_days !== undefined) {
      await upsertSetting(db, "trial_days", { days: input.trial_days }, user.userId);
    }
    if (input.pricing !== undefined) {
      await upsertSetting(
        db,
        "pricing",
        {
          ...settings.pricing,
          ...(input.pricing.monthly_inr !== undefined ? { monthly_inr: input.pricing.monthly_inr } : {}),
          ...(input.pricing.annual_inr !== undefined ? { annual_inr: input.pricing.annual_inr } : {}),
        },
        user.userId
      );
    }
    if (input.signups_open !== undefined) {
      await upsertSetting(db, "signups_open", { enabled: input.signups_open }, user.userId);
    }
    if (input.maintenance !== undefined) {
      await upsertSetting(
        db,
        "maintenance",
        {
          ...settings.maintenance,
          ...(input.maintenance.enabled !== undefined ? { enabled: input.maintenance.enabled } : {}),
          ...(input.maintenance.message !== undefined ? { message: input.maintenance.message } : {}),
        },
        user.userId
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
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

