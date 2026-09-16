// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SessionUser = {
  userId: string;
  role: "super_admin" | "owner" | "manager" | "staff";
  restaurantId: string | null;
};

// Server-only: resolves the current authenticated user + profile safely.
export async function getSessionUser(): Promise<SessionUser | null> {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

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
      : "staff";

  return {
    userId: user.id,
    role: normalizedRole,
    restaurantId: profile.restaurant_id,
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
