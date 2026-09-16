// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "owner", "staff", "waiter", "kitchen"]).default("staff"),
  restaurantId: z.string().uuid().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "owner" && user.role !== "manager" && user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Requires Manager or Owner role" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { data: profiles, error } = await admin
    .from("cafe_profiles")
    .select("id, role, display_name, active, created_at, restaurant_id")
    .eq("restaurant_id", user.restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authData } = await admin.auth.admin.listUsers();
  const emailMap = new Map((authData?.users || []).map((u) => [u.id, u.email]));

  const staff = (profiles || []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) || "—",
  }));

  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "owner" && user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can create staff accounts" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { name, email, password, role } = parsed.data;
  const restaurantId = user.restaurantId;
  const admin = createSupabaseAdmin();

  // 1. Create User in Auth
  const { data: newUser, error: authErr } = await admin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password: password,
    email_confirm: true,
  });

  if (authErr || !newUser?.user) {
    return NextResponse.json(
      { error: authErr?.message || "Failed to create user in Auth" },
      { status: 500 }
    );
  }

  const userId = newUser.user.id;

  // 2. Insert into cafe_profiles
  const { error: profileErr } = await admin.from("cafe_profiles").insert({
    id: userId,
    restaurant_id: restaurantId,
    role: role,
    display_name: name,
    active: true,
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: profileErr.message || "Failed to link profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Staff member added successfully!",
    user: { id: userId, email, role, display_name: name },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "owner" && user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can modify staff accounts" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, active, role, display_name } = body || {};
  if (!id) {
    return NextResponse.json({ error: "Missing staff id" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const updates: Record<string, any> = {};
  if (active !== undefined) updates.active = Boolean(active);
  if (role !== undefined) updates.role = role;
  if (display_name !== undefined) updates.display_name = String(display_name).trim();

  const { data, error } = await admin
    .from("cafe_profiles")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, staff: data });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "owner" && user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can delete staff accounts" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing staff id" }, { status: 400 });
  }

  if (id === user.userId) {
    return NextResponse.json({ error: "Cannot delete your own profile" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { error: profileErr } = await admin
    .from("cafe_profiles")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId);

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  await admin.auth.admin.deleteUser(id).catch(() => {});

  return NextResponse.json({ ok: true });
}
