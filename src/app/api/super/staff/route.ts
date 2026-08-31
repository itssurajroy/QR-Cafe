import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

// Super-admin-only staff lifecycle: create auth user + profile, update role/active/password, delete.
async function checkSuperAdmin(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (sessionUser && sessionUser.role === "super_admin") {
    return { ok: true, userId: sessionUser.userId };
  }

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!bearer) return { ok: false };

  const admin = createSupabaseAdmin();
  const { data: { user } } = await admin.auth.getUser(bearer);
  if (!user) return { ok: false };

  const { data: profile } = await admin
    .from("cafe_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") return { ok: false };
  return { ok: true, userId: user.id };
}

export async function POST(req: NextRequest) {
  const auth = await checkSuperAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });

  const admin = createSupabaseAdmin();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.display_name || "").trim();
  const role = body.role === "owner" ? "owner" : "staff";
  const restaurantSlug = String(body.restaurant_slug || "").trim();
  const customPassword = String(body.password || "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Valid email required" }, { status: 422 });
  if (!restaurantSlug)
    return NextResponse.json({ error: "Café required" }, { status: 422 });

  const { data: cafe } = await admin
    .from("restaurants")
    .select("id")
    .eq("slug", restaurantSlug)
    .maybeSingle();
  if (!cafe)
    return NextResponse.json({ error: "Café not found" }, { status: 404 });

  // Use custom password if provided by super admin, otherwise auto-generate
  const finalPassword = customPassword.length >= 6 ? customPassword : `QrCafe${crypto.randomUUID().slice(0, 8)}`;

  // Check if user already exists
  const { data: userList } = await admin.auth.admin.listUsers();
  const existingUser = userList?.users?.find((u) => u.email === email);

  let userId = "";

  if (existingUser) {
    // Update password and metadata for existing user
    const { error: updateErr } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: finalPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    userId = existingUser.id;
  } else {
    // Create brand new auth user
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createErr || !newUser.user) {
      return NextResponse.json(
        { error: createErr?.message || "User creation failed" },
        { status: 409 },
      );
    }
    userId = newUser.user.id;
  }

  // Upsert profile in cafe_profiles
  const { error: profErr } = await admin.from("cafe_profiles").upsert({
    id: userId,
    restaurant_id: cafe.id,
    role,
    display_name: displayName || null,
    active: true,
  });

  if (profErr) {
    if (!existingUser) await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: userId,
    email,
    password: finalPassword,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkSuperAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });

  const admin = createSupabaseAdmin();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });

  const updates: Record<string, unknown> = {};
  if (body.role === "owner" || body.role === "staff") updates.role = body.role;
  if (typeof body.active === "boolean") updates.active = body.active;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from("cafe_profiles").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle password reset by Super Admin
  if (body.password && String(body.password).trim().length >= 6) {
    const { error: passErr } = await admin.auth.admin.updateUserById(id, {
      password: String(body.password).trim(),
    });
    if (passErr) return NextResponse.json({ error: passErr.message }, { status: 500 });
  }

  if (typeof body.active === "boolean") {
    await admin.auth.admin.updateUserById(id, { ban_duration: body.active ? "none" : "876000h" });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await checkSuperAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });

  const admin = createSupabaseAdmin();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });

  await admin.from("cafe_profiles").delete().eq("id", id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
