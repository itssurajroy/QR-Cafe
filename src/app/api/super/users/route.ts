// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/platform-auth";
import { checkPlatformRateLimit } from "@/lib/rate-limit-platform";
import { logAudit } from "@/lib/audit";

const PAGE_SIZE = 50;

// Emails + last sign-ins live in auth.users — resolve via the admin API matched by id.
// Any failure degrades to "Unknown Email" / null rather than failing the request.
async function resolveEmails(
  db: ReturnType<typeof createSupabaseAdmin>,
  ids: string[]
): Promise<Record<string, { email: string; last_sign_in_at: string | null }>> {
  const map: Record<string, { email: string; last_sign_in_at: string | null }> = {};
  const missing = new Set(ids);
  try {
    for (let page = 1; page <= 10 && missing.size > 0; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) {
        if (u.id && missing.has(u.id)) {
          map[u.id] = { email: u.email ?? "Unknown Email", last_sign_in_at: u.last_sign_in_at ?? null };
          missing.delete(u.id);
        }
      }
      if (data.users.length < 1000) break;
    }
  } catch {
    // fall through — unresolved ids stay "Unknown Email"
  }
  return map;
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams;
  const role = (q.get("role") || "").trim();
  const restaurantId = (q.get("restaurant_id") || "").trim();
  const active = (q.get("active") || "").trim().toLowerCase();
  const search = (q.get("q") || "").trim();
  const page = Math.max(1, parseInt(q.get("page") || "1", 10));
  const fromIdx = (page - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  const db = createSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyFilters(query: any): any {
    let out = query;
    if (role) out = out.eq("role", role);
    if (restaurantId) out = out.eq("restaurant_id", restaurantId);
    if (active === "true" || active === "1") out = out.eq("active", true);
    else if (active === "false" || active === "0") out = out.eq("active", false);
    if (search) out = out.ilike("display_name", `%${search}%`);
    return out;
  }

  // Join cafe_profiles + restaurant names; degrade gracefully if the
  // restaurants embed is unavailable in this environment.
  let profiles: any[] | null = null;
  let total = 0;
  const withJoin = await applyFilters(
    db
      .from("cafe_profiles")
      .select("id, restaurant_id, role, display_name, active, restaurants(name,slug)", { count: "exact" })
      .order("display_name", { ascending: true })
  ).range(fromIdx, toIdx);
  if (withJoin.error && /restaurant/i.test(withJoin.error.message)) {
    const fallback = await applyFilters(
      db
        .from("cafe_profiles")
        .select("id, restaurant_id, role, display_name, active", { count: "exact" })
        .order("display_name", { ascending: true })
    ).range(fromIdx, toIdx);
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    profiles = fallback.data ?? [];
    total = fallback.count ?? 0;
  } else {
    if (withJoin.error) return NextResponse.json({ error: withJoin.error.message }, { status: 500 });
    profiles = withJoin.data ?? [];
    total = withJoin.count ?? 0;
  }

  const authInfo = await resolveEmails(db, (profiles ?? []).map((p: any) => p.id));

  const rows = (profiles ?? []).map((p: any) => ({
    id: p.id,
    email: authInfo[p.id]?.email ?? "Unknown Email",
    last_sign_in_at: authInfo[p.id]?.last_sign_in_at ?? null,
    restaurant_id: p.restaurant_id ?? null,
    restaurant_name: p.restaurants?.name ?? null,
    restaurant_slug: p.restaurants?.slug ?? null,
    role: p.role,
    display_name: p.display_name ?? null,
    active: p.active ?? true,
  }));

  return NextResponse.json({
    ok: true,
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}

const postSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("disable"), user_id: z.string().uuid() }),
  z.object({ op: z.literal("enable"), user_id: z.string().uuid() }),
  z.object({ op: z.literal("set_role"), user_id: z.string().uuid(), role: z.string().min(1).max(20) }),
  z.object({ op: z.literal("reset_password"), user_id: z.string().uuid() }),
]);

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;

  const db = createSupabaseAdmin();

  // Support role is enforced inside: read the actor's platform_users row.
  // Missing table/row → treat as super_admin full access (backward compatible).
  let platformUser: { role: string; permissions?: Record<string, boolean>; is_active?: boolean } | null = null;
  try {
    const { data, error } = await db
      .from("platform_users")
      .select("role, permissions, is_active")
      .eq("id", user.userId)
      .maybeSingle();
    if (!error && data) {
      platformUser = {
        role: data.role,
        permissions: (data.permissions as Record<string, boolean>) ?? {},
        is_active: data.is_active ?? true,
      };
    }
  } catch {
    platformUser = null;
  }
  const gateUser = (platformUser ?? { role: "super_admin" }) as Parameters<typeof requirePermission>[0];
  if (!requirePermission(gateUser, "users.write")) {
    return NextResponse.json({ error: "Forbidden: missing users.write permission" }, { status: 403 });
  }

  const rl = checkPlatformRateLimit(user.userId, `user.${input.op}`, 20, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  if (input.op === "disable" || input.op === "enable") {
    const next = input.op === "enable";
    const { data: existing } = await db
      .from("cafe_profiles")
      .select("id, restaurant_id")
      .eq("id", input.user_id)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { error } = await db.from("cafe_profiles").update({ active: next }).eq("id", input.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(db, {
      actor_id: user.userId,
      restaurant_id: existing.restaurant_id ?? null,
      entity: "user",
      entity_id: input.user_id,
      action: next ? "user.enabled" : "user.disabled",
      metadata: { user_id: input.user_id },
    });
    return NextResponse.json({ ok: true, id: input.user_id, active: next });
  }

  if (input.op === "set_role") {
    const nextRole = input.role.trim().toLowerCase();
    if (nextRole !== "owner" && nextRole !== "staff") {
      return NextResponse.json({ error: "Cannot grant super_admin via this route" }, { status: 422 });
    }
    const { data: existing } = await db
      .from("cafe_profiles")
      .select("id, restaurant_id, role")
      .eq("id", input.user_id)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { error } = await db.from("cafe_profiles").update({ role: nextRole }).eq("id", input.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(db, {
      actor_id: user.userId,
      restaurant_id: existing.restaurant_id ?? null,
      entity: "user",
      entity_id: input.user_id,
      action: "user.role_changed",
      metadata: { user_id: input.user_id, from: existing.role, to: nextRole },
    });
    return NextResponse.json({ ok: true, id: input.user_id, role: nextRole });
  }

  // reset_password — returns a recovery link for support to forward;
  // never emails directly from this route.
  const { data: target, error: targetErr } = await db.auth.admin.getUserById(input.user_id);
  if (targetErr || !target?.user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
    type: "recovery",
    email: target.user.email,
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkErr?.message || "Failed to generate recovery link" }, { status: 500 });
  }
  let restaurantId: string | null = null;
  try {
    const { data: prof } = await db.from("cafe_profiles").select("restaurant_id").eq("id", input.user_id).maybeSingle();
    restaurantId = prof?.restaurant_id ?? null;
  } catch {
    restaurantId = null;
  }
  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: restaurantId,
    entity: "user",
    entity_id: input.user_id,
    action: "user.password_reset",
    metadata: { user_id: input.user_id },
  });
  return NextResponse.json({ ok: true, link: linkData.properties.action_link });
}
