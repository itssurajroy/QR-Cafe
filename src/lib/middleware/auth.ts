// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { profileCache } from "./cache";

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

