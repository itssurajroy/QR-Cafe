// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const db = createSupabaseAdmin();
  const userId = auth.userId;
  
  // Fetch active sessions from auth.sessions or a dedicated sessions table
  // For now, derive from auth user metadata
  const { data: user } = await db.auth.admin.getUserById(userId);
  
  // In production, you'd query a sessions table that tracks active sessions
  // This is a mock response based on real user data
  const sessions = [
    {
      id: "sess_current",
      device: "Current Session",
      ip: "Auto-detected",
      location: "Auto-detected",
      lastActive: "Active now",
      isCurrent: true,
    },
  ];
  
  return NextResponse.json({ ok: true, sessions });
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const sessionId = new URL(req.url).searchParams.get("id");
  if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  
  // In production, you'd revoke the session in your sessions table
  // For now, just return success
  return NextResponse.json({ ok: true });
}