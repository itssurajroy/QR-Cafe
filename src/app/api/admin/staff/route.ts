// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const createStaffSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "staff"]).default("staff"),
});

export async function POST(req: NextRequest) {
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

  const { restaurantId, name, email, password, role } = parsed.data;
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
    // Attempt rollback
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

