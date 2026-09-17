// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // 1. Authenticate user and set server cookie session
  const serverDb = await createSupabaseServerClient();
  const { data: authData, error: authError } = await serverDb.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || "Invalid email or password" },
      { status: 401 },
    );
  }

  // 2. Fetch user profile reliably using admin client (bypasses RLS recursion during auth handshake)
  const adminDb = createSupabaseAdmin();
  const { data: profile, error: profErr } = await adminDb
    .from("cafe_profiles")
    .select("role, restaurant_id, active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profErr || !profile || !profile.active) {
    return NextResponse.json(
      { error: "User profile inactive or not found in cafe_profiles table" },
      { status: 403 },
    );
  }

  const rawRole = String(profile.role || "").toLowerCase();
  const destination =
    rawRole === "super_admin"
      ? "/super"
      : rawRole === "owner" || rawRole === "manager" || rawRole === "admin"
        ? "/admin"
        : rawRole === "kitchen" || rawRole === "chef"
          ? "/pos?view=kitchen"
          : "/pos";

  return NextResponse.json({
    ok: true,
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: profile.role,
    },
    destination,
  });
}

