// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { profileCache } from "./cache";
import { PIN_SESSION_COOKIE, verifyPinSession } from "@/lib/pin-auth";

async function checkPinSession(request: NextRequest) {
  const token = request.cookies.get(PIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  let payload: { sub: string; rid: string; role: string } | null = null;
  try {
    payload = await verifyPinSession(token);
  } catch {
    return null;
  }
  if (!payload) return null;

  // PIN sessions are counter-staff only (kitchen/waiter/staff). Owner,
  // manager, and super_admin must always use email + password.
  const role = String(payload.role || "staff").toLowerCase();
  if (role !== "kitchen" && role !== "waiter" && role !== "staff") {
    return null;
  }

  // Re-check active status server-side so owner deactivation takes effect
  // immediately. No user JWT exists for PIN sessions, so this uses the
  // service-role key (middleware runs server-side; never exposed to browsers).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const cacheKey = `pin:${payload.sub}`;
  const cached = profileCache.get(cacheKey);
  if (cached) return { user: { id: payload.sub }, profile: cached };

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/cafe_profiles?id=eq.${payload.sub}&select=role,restaurant_id,active`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const profile = data?.[0];
    if (!profile || !profile.active || profile.restaurant_id !== payload.rid) {
      return null;
    }
    profileCache.set(cacheKey, profile);
    return { user: { id: payload.sub }, profile };
  } catch (err) {
    console.error("Middleware PIN session fetch error:", err);
    return null;
  }
}

export async function checkAuthAndProfile(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.delete(name);
        response.cookies.delete(name);
      },
    },
  });

  // 0. PIN quick sign-in session (shared counter terminals). Checked first
  // so kitchen/waiter staff work without a Supabase email session.
  const pinSession = await checkPinSession(request);
  if (pinSession) {
    return { user: pinSession.user, profile: pinSession.profile, response };
  }

  // 1. Get user session (validates JWT, refreshes if needed)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, response };
  }

  // 2. Resolve profile
  let profile = profileCache.get(user.id);
  if (!profile) {
    // Edge-compatible fetch to get cafe_profile
    // Using service role to bypass RLS, or just anon if it's public.
    // cafe_profiles usually has RLS requiring auth, we can use the user's JWT.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseAnonKey;
      
      const res = await fetch(`${supabaseUrl}/rest/v1/cafe_profiles?id=eq.${user.id}&select=role,restaurant_id,active`, {
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${token}`,
        },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          profile = data[0];
          profileCache.set(user.id, profile);
        }
      }
    } catch (err) {
      console.error("Middleware profile fetch error:", err);
    }
  }

  return { user, profile, response };
}

