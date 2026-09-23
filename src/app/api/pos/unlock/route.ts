// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/pos-guard";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPinHash } from "@/lib/pin-auth";

const unlockSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

const MAX_UNLOCK_ATTEMPTS = 5;
const UNLOCK_LOCK_MS = 15 * 60 * 1000;

/**
 * Workstation unlock (soft lock re-auth).
 * Verifies the session user's staff PIN against cafe_profiles.pin_hash.
 * Attempt counters use the same DB columns as PIN login (Phase 7).
 */
export async function POST(req: NextRequest) {
  const guard = await requireTenant();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = unlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "4-digit PIN required" },
      { status: 422 },
    );
  }

  const rl = rateLimit(`pos-unlock:${ip}:${user.userId}`, MAX_UNLOCK_ATTEMPTS, 60);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "Too many unlock attempts. Please wait a moment.",
        retryAfter: rl.retryAfter,
      },
      { status: 429 },
    );
  }

  const admin = createSupabaseAdmin();
  const { data: profile, error: pErr } = await admin
    .from("cafe_profiles")
    .select(
      "id, restaurant_id, active, pin_hash, pin_failed_attempts, pin_locked_until",
    )
    .eq("id", user.userId)
    .eq("restaurant_id", user.restaurantId as string)
    .maybeSingle();

  if (pErr || !profile || !profile.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (profile.pin_locked_until && new Date(profile.pin_locked_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Account locked. Try again later." },
      { status: 423 },
    );
  }

  // Password sessions without a staff PIN cannot use the PIN keypad.
  if (!profile.pin_hash) {
    return NextResponse.json(
      {
        error: "No staff PIN set for this account. Use Switch User to re-authenticate.",
        needsPassword: true,
      },
      { status: 403 },
    );
  }

  const ok = await verifyPinHash(
    parsed.data.pin,
    profile.restaurant_id,
    profile.id,
    profile.pin_hash,
  );

  if (!ok) {
    const attempts = (profile.pin_failed_attempts || 0) + 1;
    await admin
      .from("cafe_profiles")
      .update({
        pin_failed_attempts: attempts,
        pin_locked_until:
          attempts >= MAX_UNLOCK_ATTEMPTS
            ? new Date(Date.now() + UNLOCK_LOCK_MS).toISOString()
            : null,
      })
      .eq("id", profile.id);

    return NextResponse.json(
      {
        error: "Invalid PIN",
        attempts,
        remaining: Math.max(0, MAX_UNLOCK_ATTEMPTS - attempts),
      },
      { status: 401 },
    );
  }

  if ((profile.pin_failed_attempts || 0) > 0 || profile.pin_locked_until) {
    await admin
      .from("cafe_profiles")
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq("id", profile.id);
  }

  return NextResponse.json({ ok: true });
}
