// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/platform-auth";
import { checkPlatformRateLimit } from "@/lib/rate-limit-platform";
import { logAudit } from "@/lib/audit";
import { generateApiKey } from "@/lib/api-keys";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  restaurant_id: z.string().uuid().nullable().optional(),
});

const revokeSchema = z.object({
  id: z.string().uuid(),
});

function platformGate(platformUser: { role: string; permissions?: Record<string, boolean>; is_active?: boolean } | null) {
  return requirePermission(
    (platformUser ?? { role: "super_admin" }) as Parameters<typeof requirePermission>[0],
    "api_keys.write"
  );
}

async function readPlatformUser(db: ReturnType<typeof createSupabaseAdmin>, userId: string) {
  try {
    const { data, error } = await db
      .from("platform_users")
      .select("role, permissions, is_active")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      role: data.role as string,
      permissions: (data.permissions as Record<string, boolean>) ?? {},
      is_active: data.is_active ?? true,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  try {
    const { data, error } = await db
      .from("platform_api_keys")
      .select("id, name, key_prefix, restaurant_id, created_by, revoked_at, last_used_at, created_at, restaurants(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, keys: (data ?? []).map((k: any) => ({ ...k, restaurant_name: k.restaurants?.name ?? null })) });
  } catch (e: any) {
    // Table may not exist live yet (migration unapplied) — degrade, never crash.
    return NextResponse.json({ ok: true, keys: [], degraded: true, error: e?.message || "unavailable" });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  if (!platformGate(await readPlatformUser(createSupabaseAdmin(), user.userId))) {
    return NextResponse.json({ error: "Forbidden: missing api_keys.write permission" }, { status: 403 });
  }
  const rl = checkPlatformRateLimit(user.userId, "api-key.create", 20, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const db = createSupabaseAdmin();
  const { key, hash, prefix } = generateApiKey();
  const { data, error } = await db
    .from("platform_api_keys")
    .insert({
      name: parsed.data.name,
      key_prefix: prefix,
      key_hash: hash,
      restaurant_id: parsed.data.restaurant_id ?? null,
      created_by: user.userId,
    })
    .select("id, name, key_prefix, restaurant_id, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 });
  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: parsed.data.restaurant_id ?? null,
    entity: "api_key",
    entity_id: data.id,
    action: "api_key.created",
    metadata: { name: parsed.data.name, prefix },
  });
  // Raw secret is returned ONCE and never stored.
  return NextResponse.json({ ok: true, key, record: data });
}

export async function DELETE(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  if (!platformGate(await readPlatformUser(createSupabaseAdmin(), user.userId))) {
    return NextResponse.json({ error: "Forbidden: missing api_keys.write permission" }, { status: 403 });
  }

  const db = createSupabaseAdmin();
  const { error } = await db
    .from("platform_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .is("revoked_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: null,
    entity: "api_key",
    entity_id: parsed.data.id,
    action: "api_key.revoked",
    metadata: {},
  });
  return NextResponse.json({ ok: true, revoked: parsed.data.id });
}
