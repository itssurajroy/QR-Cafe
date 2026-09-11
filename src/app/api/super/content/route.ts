import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { clearContentCache } from "@/lib/content";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("platform_config")
    .select("key, value, updated_at")
    .like("key", "cms.%")
    .order("key");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}

const putSchema = z.object({
  key: z.string().regex(/^cms\.[a-z0-9_.]+$/, "Key must look like cms.section.field"),
  value: z.unknown(),
});

export async function PUT(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const { key, value } = parsed.data;
  const db = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: existing } = await db.from("platform_config").select("key").eq("key", key).maybeSingle();
  const payload = { value: value as Record<string, unknown>, updated_at: now, updated_by: user.userId };
  const { error } = existing
    ? await db.from("platform_config").update(payload).eq("key", key)
    : await db.from("platform_config").insert({ key, ...payload });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  clearContentCache(key);
  await db.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: null,
    entity: "content",
    entity_id: key,
    action: "super_content_edit",
    metadata: { key },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!/^cms\.[a-z0-9_.]+$/.test(key)) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const db = createSupabaseAdmin();
  const { error } = await db.from("platform_config").delete().eq("key", key).like("key", "cms.%");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  clearContentCache(key);
  await db.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: null,
    entity: "content",
    entity_id: key,
    action: "super_content_reset",
    metadata: { key },
  });
  return NextResponse.json({ ok: true });
}
