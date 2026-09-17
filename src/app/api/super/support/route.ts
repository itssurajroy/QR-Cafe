// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { checkPlatformRateLimit } from "@/lib/rate-limit-platform";
import { sendTrialEmail } from "@/lib/email";

const PRIORITY_PREFIX = "[PRIORITY] ";

const schema = z.object({
  op: z.enum(["resend_welcome", "resend_trial_ending", "toggle_priority", "add_note"]),
  cafeId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

async function ownerEmail(db: ReturnType<typeof createSupabaseAdmin>, cafeId: string): Promise<string | null> {
  const { data: owner } = await db
    .from("cafe_profiles")
    .select("id")
    .eq("restaurant_id", cafeId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!owner) return null;
  const { data: user } = await db.auth.admin.getUserById((owner as { id: string }).id);
  return user?.user?.email ?? null;
}

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const { op, cafeId } = parsed.data;

  const rl = checkPlatformRateLimit(user.userId, `support.${op}`, 20, 3_600_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const db = createSupabaseAdmin();
  const { data: cafe, error: cafeErr } = await db
    .from("restaurants")
    .select("id, name, slug, trial_ends_at, internal_notes")
    .eq("id", cafeId)
    .maybeSingle();
  if (cafeErr || !cafe) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  const row = cafe as { id: string; name: string; slug: string; trial_ends_at: string | null; internal_notes: string | null };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";

  if (op === "resend_welcome" || op === "resend_trial_ending") {
    const day = op === "resend_welcome" ? 0 : 14;
    const email = await ownerEmail(db, cafeId);
    if (!email) return NextResponse.json({ error: "Owner email not found" }, { status: 404 });
    const daysLeft = row.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(row.trial_ends_at).getTime() - Date.now()) / 864e5))
      : 0;
    // Sends only via the existing email helper — explicit button click, never automatic.
    const { sent, skipped } = await sendTrialEmail(email, day as 0 | 14, {
      cafeName: row.name,
      daysLeft,
      billingUrl: `${appUrl}/admin/billing`,
    });
    await logAudit(db, {
      actor_id: user.userId,
      restaurant_id: cafeId,
      entity: "tenant",
      entity_id: cafeId,
      action: "support.email_resent",
      metadata: { day, to: email, sent, skipped: skipped ?? null },
    });
    return NextResponse.json({ ok: true, sent, skipped: skipped ?? null });
  }

  if (op === "toggle_priority") {
    const current = row.internal_notes ?? "";
    const isPriority = current.startsWith(PRIORITY_PREFIX);
    const next = isPriority ? current.slice(PRIORITY_PREFIX.length) : `${PRIORITY_PREFIX}${current}`;
    const { error } = await db.from("restaurants").update({ internal_notes: next }).eq("id", cafeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(db, {
      actor_id: user.userId,
      restaurant_id: cafeId,
      entity: "tenant",
      entity_id: cafeId,
      action: "support.priority_toggled",
      metadata: { priority: !isPriority },
    });
    return NextResponse.json({ ok: true, priority: !isPriority, internal_notes: next });
  }

  // add_note: append-only — existing internal_notes content is never rewritten.
  const note = (parsed.data.note ?? "").trim();
  if (!note) return NextResponse.json({ error: "Note is required" }, { status: 422 });
  const line = JSON.stringify({ at: new Date().toISOString(), by: user.userId, note });
  const next = row.internal_notes ? `${row.internal_notes}\n${line}` : line;
  const { error } = await db.from("restaurants").update({ internal_notes: next }).eq("id", cafeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(db, {
    actor_id: user.userId,
    restaurant_id: cafeId,
    entity: "tenant",
    entity_id: cafeId,
    action: "support.note_added",
    metadata: { note },
  });
  return NextResponse.json({ ok: true, internal_notes: next });
}
