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
  const restaurantId = auth.restaurantId;

  // Get user profile from auth
  const { data: userData } = await db.auth.admin.getUserById(userId);
  const user = userData && "user" in userData ? userData.user : null;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get restaurant details
  const { data: restaurant } = await db
    .from("restaurants")
    .select("id, name, slug, plan, tier, trial_ends_at, subscription_ends_at, billing_status, created_at, owner_name, owner_email")
    .eq("id", restaurantId)
    .single();

  // Get cafe profile
  const { data: profile } = await db
    .from("cafe_profiles")
    .select("role, display_name, active, pin")
    .eq("id", userId)
    .single();

  // Get subscription info
  const plan = restaurant?.plan || "trial";
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 864e5)) : 0;
  const isTrial = plan === "trial";
  const isSuspended = plan === "suspended" || (isTrial && daysLeft === 0);

  return NextResponse.json({
    ok: true,
    profile: {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || profile?.display_name || user.email?.split("@")[0] || "",
      phone: user.phone || "",
      role: profile?.role || "owner",
      active: profile?.active ?? true,
      email_confirmed: user.email_confirmed_at ? true : false,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      pin: profile?.pin ? true : false,
    },
    restaurant: {
      id: restaurant?.id,
      name: restaurant?.name,
      slug: restaurant?.slug,
      plan,
      tier: restaurant?.tier,
      trial_ends_at: restaurant?.trial_ends_at,
      subscription_ends_at: restaurant?.subscription_ends_at,
      billing_status: restaurant?.billing_status,
      created_at: restaurant?.created_at,
      owner_name: restaurant?.owner_name,
      owner_email: restaurant?.owner_email,
    },
    subscription: {
      plan,
      isTrial,
      isSuspended,
      daysLeft,
      trialEndsAt: restaurant?.trial_ends_at,
      subscriptionEndsAt: restaurant?.subscription_ends_at,
      billingStatus: restaurant?.billing_status,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const userId = auth.userId;
  const restaurantId = auth.restaurantId;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, ...data } = body;

  try {
    switch (action) {
      case "update_profile": {
        const { display_name, phone } = data;
        const updates: Record<string, any> = {};
        if (display_name !== undefined) updates.display_name = display_name.trim();
        if (phone !== undefined) updates.phone = phone.trim();

        if (Object.keys(updates).length > 0) {
          // Update cafe_profiles
          const { error: profileError } = await db
            .from("cafe_profiles")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", userId);
          if (profileError) throw profileError;

          // Update auth user metadata if display_name changed
          if (updates.display_name) {
            await db.auth.admin.updateUserById(userId, {
              user_metadata: { display_name: updates.display_name },
            });
          }
        }
        break;
      }

      case "change_password": {
        const { current_password, new_password } = data;
        if (!current_password || !new_password) {
          return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
        }
        if (new_password.length < 8) {
          return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        // Verify current password by attempting to sign in
        const { error: signInError } = await db.auth.signInWithPassword({
          email: (await db.auth.admin.getUserById(userId)).data?.user?.email || "",
          password: current_password,
        });
        if (signInError) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        // Update password
        const { error: updateError } = await db.auth.admin.updateUserById(userId, {
          password: new_password,
        });
        if (updateError) throw updateError;
        break;
      }

      case "toggle_2fa": {
        const { enabled } = data;
        // In a real implementation, you'd store 2FA settings in a dedicated table
        // For now, we'll store it in cafe_profiles metadata
        const { error } = await db
          .from("cafe_profiles")
          .update({ 
            two_factor_enabled: enabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        if (error) throw error;
        break;
      }

      case "update_pin": {
        const { pin } = data;
        if (pin && !/^\d{4}$/.test(pin)) {
          return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
        }
        const { error } = await db
          .from("cafe_profiles")
          .update({ 
            pin: pin || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        if (error) throw error;
        break;
      }

      case "deactivate_account": {
        const { confirmation } = data;
        if (confirmation !== "DELETE") {
          return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
        }
        // Soft delete - mark as inactive and ban auth user
        await db.from("cafe_profiles").update({ active: false }).eq("id", userId);
        await db.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
        await db.from("restaurants").update({ plan: "cancelled" }).eq("id", restaurantId);
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Account PATCH] Error:", err);
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}