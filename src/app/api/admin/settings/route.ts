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
  const restaurantId = auth.restaurantId;

  const { data: config } = await db
    .from("platform_config")
    .select("key, value")
    .eq("restaurant_id", restaurantId)
    .in("key", ["api_key", "webhook_url", "webhook_secret"]);

  const configMap = new Map((config ?? []).map((c: any) => [c.key, c.value]));

  return NextResponse.json({
    ok: true,
    api_key: configMap.get("api_key") || `qrslice_live_pk_${Math.random().toString(36).substring(2, 15)}`,
    webhook_url: configMap.get("webhook_url") || "",
    webhook_secret: configMap.get("webhook_secret") || `whsec_${Math.random().toString(36).substring(2, 15)}`,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};

    // Map of allowed settings
    const allowedKeys = [
      "api_key",
      "webhook_url",
      "webhook_secret",
      "whatsapp_enabled",
      "razorpay_key",
      "printer_configured",
      "email_configured",
      "sms_configured",
      "tally_configured",
      "delivery_configured",
      "ga4_configured",
      "google_reviews_configured",
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(updates)) {
      await db
        .from("platform_config")
        .upsert(
          { key, value, restaurant_id: restaurantId, updated_at: new Date().toISOString() },
          { onConflict: "key,restaurant_id" }
        );
    }

    return NextResponse.json({ ok: true, settings: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}