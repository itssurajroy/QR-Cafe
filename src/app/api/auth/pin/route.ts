// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  PIN_SESSION_COOKIE,
  PIN_SESSION_TTL_MS,
  signPinSession,
  validatePinFormat,
  verifyPinHash,
} from "@/lib/pin-auth";

const pinLoginSchema = z.object({
  // Exactly one restaurant identifier is required: slug (cafe code) or id.
  restaurant_slug: z.string().min(2).max(50).optional(),
  restaurant_id: z.string().uuid().optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
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

  const parsed = pinLoginSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.restaurant_slug && !parsed.data.restaurant_id)) {
    return NextResponse.json(
      { error: "restaurant_slug (or restaurant_id) and a 4-digit pin are required" },
      { status: 422 },
    );
  }
  const { restaurant_slug, restaurant_id, pin } = parsed.data;

  // Rate limit: 10 PIN attempts per IP per minute (brute-force protection
  // on top of per-profile lockout below).
  const rl = rateLimit(`pin:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const admin = createSupabaseAdmin();

  // 1. Resolve restaurant
  let restaurantId = restaurant_id ?? null;
  if (!restaurantId && restaurant_slug) {
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("id")
      .eq("slug", restaurant_slug.toLowerCase().trim())
      .maybeSingle();
    if (!restaurant) {
      return NextResponse.json({ error: "Invalid café code or PIN" }, { status: 401 });
    }
    restaurantId = restaurant.id;
  }

  // 2. Candidate PIN-enabled staff in this restaurant
  const { data: candidates, error: cErr } = await admin
    .from("cafe_profiles")
    .select("id, role, display_name, active, restaurant_id, pin_hash, pin_failed_attempts, pin_locked_until")
    .eq("restaurant_id", restaurantId as string)
    .eq("active", true)
    .not("pin_hash", "is", null);

  if (cErr || !candidates || candidates.length === 0) {
    return NextResponse.json({ error: "Invalid café code or PIN" }, { status: 401 });
  }

  // 3. Constant-work comparison across candidates (don't leak which PIN exists)
  let matched: (typeof candidates)[number] | null = null;
  for (const c of candidates) {
    if (!c.pin_hash) continue;
    if (c.pin_locked_until && new Date(c.pin_locked_until).getTime() > Date.now()) {
      continue;
    }
    const ok = await verifyPinHash(pin, c.restaurant_id, c.id, c.pin_hash);
    if (ok) {
      matched = c;
      break;
    }
  }

  if (!matched) {
    // Increment failure counters (drives per-profile lockout).
    const now = Date.now();
    for (const c of candidates) {
      const attempts = (c.pin_failed_attempts || 0) + 1;
      const updates: Record<string, unknown> = {
        pin_failed_attempts: attempts,
        pin_locked_until:
          attempts >= MAX_PIN_ATTEMPTS
            ? new Date(now + PIN_LOCK_MS).toISOString()
            : null,
      };
      await admin.from("cafe_profiles").update(updates).eq("id", c.id);
    }
    return NextResponse.json({ error: "Invalid café code or PIN" }, { status: 401 });
  }

  // 4. PIN sessions are counter-staff only (kitchen/waiter/staff).
  const rawRole = String(matched.role || "staff").toLowerCase();
  const role =
    rawRole === "kitchen" || rawRole === "chef"
      ? "kitchen"
      : rawRole === "waiter"
      ? "waiter"
      : rawRole === "staff"
      ? "staff"
      : null;
  if (!role) {
    return NextResponse.json(
      { error: "This account must sign in with email + password" },
      { status: 403 },
    );
  }

  // 5. Reset failure counters, issue signed session cookie.
  await admin
    .from("cafe_profiles")
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq("id", matched.id);

  if (!validatePinFormat(pin)) {
    return NextResponse.json({ error: "Invalid café code or PIN" }, { status: 401 });
  }

  const token = await signPinSession({ sub: matched.id, rid: matched.restaurant_id, role });

  const destination = role === "kitchen" ? "/pos?view=kitchen" : "/pos";

  const res = NextResponse.json({
    ok: true,
    user: {
      id: matched.id,
      display_name: matched.display_name,
      role,
      authMethod: "pin",
    },
    destination,
  });
  res.cookies.set(PIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(PIN_SESSION_TTL_MS / 1000),
  });
  return res;
}
