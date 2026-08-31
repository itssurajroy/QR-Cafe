import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SessionUser = {
  userId: string;
  role: "super_admin" | "owner" | "staff";
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
  return {
    userId: user.id,
    role: profile.role,
    restaurantId: profile.restaurant_id,
  };
}
