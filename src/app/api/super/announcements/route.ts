// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { checkPlatformRateLimit } from "@/lib/rate-limit-platform";

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createSupabaseAdmin();
  try {
    const { data, error } = await db
      .from("platform_announcements")
      .select("id, title, body, target_plan, starts_at, ends_at, created_by, created_at")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, announcements: data ?? [] });
  } catch {
    // platform_announcements may not exist live yet — degrade gracefully.
    return NextResponse.json({ ok: true, announcements: [] });
  }
}

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid ISO date" });

const postSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().max(2000).default(""),
  target_plan: z.enum(["all", "trial", "active", "suspended"]),
  starts_at: isoDate,
  ends_at: isoDate.nullable().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;

  const rl = checkPlatformRateLimit(user.userId, "announcement.create", 20, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("platform_announcements")
    .insert({
      title: input.title.trim(),
      body: input.body ?? "",
      target_plan: input.target_plan,
      starts_at: new Date(input.starts_at).toISOString(),
      ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
      created_by: user.userId,
    })
    .select("id, title, body, target_plan, starts_at, ends_at, created_by, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 });

  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: null,
    entity: "announcement",
    entity_id: data.id,
    action: "announcement.created",
    metadata: { title: input.title, target_plan: input.target_plan },
  });
  return NextResponse.json({ ok: true, announcement: data }, { status: 201 });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });

  const db = createSupabaseAdmin();
  const { error } = await db.from("platform_announcements").delete().eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: null,
    entity: "announcement",
    entity_id: parsed.data.id,
    action: "announcement.deleted",
    metadata: {},
  });
  return NextResponse.json({ ok: true, deleted: parsed.data.id });
}
