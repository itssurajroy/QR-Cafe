import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("feature_flags")
    .select("key, enabled, description, updated_at")
    .order("key", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, flags: data ?? [] });
}

const postSchema = z.object({
  key: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  enabled: z.boolean(),
  description: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;
  const db = createSupabaseAdmin();
  const { data: flag, error } = await db
    .from("feature_flags")
    .upsert(
      {
        key: input.key,
        enabled: input.enabled,
        description: input.description ?? "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .select("key, enabled, description, updated_at")
    .single();
  if (error || !flag) return NextResponse.json({ error: error?.message || "Upsert failed" }, { status: 500 });
  await db.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: null,
    entity: "flag",
    entity_id: input.key,
    action: "super_flag_change",
    metadata: { key: input.key, enabled: input.enabled },
  });
  return NextResponse.json({ ok: true, flag });
}
