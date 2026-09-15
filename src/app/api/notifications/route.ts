// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  try {
    const now = new Date().toISOString();
    const { data, error } = await db
      .from("platform_announcements")
      .select("id, title, body, target_plan, starts_at, ends_at, created_at")
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("starts_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, notifications: data ?? [] });
  } catch (err: unknown) {
    console.error("Failed to fetch notifications:", err);
    return NextResponse.json({ ok: true, notifications: [] });
  }
}
