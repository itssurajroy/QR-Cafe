// Copyright (c) 2026 QRslice. All rights reserved.
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PIN_SESSION_COOKIE, verifyPinSession } from "@/lib/pin-auth";

export type SessionUser = {
  userId: string;
  role: "super_admin" | "owner" | "manager" | "staff" | "kitchen" | "waiter";
  restaurantId: string | null;
  authMethod?: "password" | "pin";
};

// Server-only: resolves the current authenticated user + profile safely.
export async function getSessionUser(): Promise<SessionUser | null> {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return getPinSessionUser();

  // Use admin client to reliably resolve cafe_profile without RLS chicken-and-egg lock
  const adminDb = createSupabaseAdmin();
  const { data: profile } = await adminDb
    .from("cafe_profiles")
    .select("role, restaurant_id, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.active) return null;

  const rawRole = String(profile.role || "staff").toLowerCase();
  const normalizedRole: SessionUser["role"] =
    rawRole === "super_admin"
      ? "super_admin"
      : rawRole === "owner"
      ? "owner"
      : rawRole === "manager" || rawRole === "admin"
      ? "manager"
      : rawRole === "kitchen" || rawRole === "chef"
      ? "kitchen"
      : rawRole === "waiter"
      ? "waiter"
      : "staff";

  return {
    userId: user.id,
    role: normalizedRole,
    restaurantId: profile.restaurant_id,
    authMethod: "password",
  };
}

// Server-only: returns the session user iff super_admin, else null.
// Pages: `const user = await requireSuperAdmin(); if (!user) redirect("/login")`.
// API routes: `const user = await requireSuperAdmin(); if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })`.
export async function requireSuperAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "super_admin") return null;
  return user;
}

// Server-only: resolves a PIN quick sign-in session (shared terminals).
// The token is HMAC-signed, but active status + role are re-checked in DB
// on every call so owner deactivation/revocation takes effect immediately.
async function getPinSessionUser(): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    token = (await cookies()).get(PIN_SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;

  let payload: { sub: string; rid: string; role: string } | null = null;
  try {
    payload = await verifyPinSession(token);
  } catch {
    return null;
  }
  if (!payload) return null;

  const adminDb = createSupabaseAdmin();
  const { data: profile } = await adminDb
    .from("cafe_profiles")
    .select("role, restaurant_id, active")
    .eq("id", payload.sub)
    .eq("restaurant_id", payload.rid)
    .maybeSingle();

  if (!profile || !profile.active) return null;

  const rawRole = String(profile.role || "staff").toLowerCase();
  const normalizedRole: SessionUser["role"] =
    rawRole === "owner"
      ? "owner"
      : rawRole === "manager" || rawRole === "admin"
      ? "manager"
      : rawRole === "kitchen" || rawRole === "chef"
      ? "kitchen"
      : rawRole === "waiter"
      ? "waiter"
      : "staff";

  // PIN sessions are counter-staff only: kitchen, waiter, staff.
  // Owner/manager/super_admin must always use email + password.
  if (
    normalizedRole !== "kitchen" &&
    normalizedRole !== "waiter" &&
    normalizedRole !== "staff"
  ) {
    return null;
  }

  return {
    userId: payload.sub,
    role: normalizedRole,
    restaurantId: profile.restaurant_id,
    authMethod: "pin",
  };
}
