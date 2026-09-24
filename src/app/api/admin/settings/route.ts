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

  const keysToFetch = [
    "api_key", "webhook_url", "webhook_secret",
    "gstin", "fssai", "restaurantEmail", "currency", "timezone", "invoicePrefix",
    "tagline", "accentColor", "googleReviewUrl",
    "businessHours",
    "cgstRate", "sgstRate", "igstRate", "serviceChargeRate", "isInclusivePricing", "roundToNearestRupee",
    "enableCash", "enableCard", "enableUpi",
    "qrType", "afterScanAction", "allowCustomerOrdering", "requireTableSelection", "showQrBranding",
    "printers",
    "soundAlerts", "emailAlerts", "orderReadySms",
    "waEnabled", "waTemplate", "waIncludeReviewCta", "waIncludeGstin", "waThankYou", "autoSendWaBill", "includePdfInvoice", "includeOrderAgainBtn"
  ];

  const { data: config } = await db
    .from("platform_config")
    .select("key, value")
    .eq("restaurant_id", restaurantId)
    .in("key", keysToFetch);

  const configMap = new Map((config ?? []).map((c: any) => [c.key, c.value]));

  const responseObj: any = { ok: true };
  for (const key of keysToFetch) {
    if (configMap.has(key)) {
      responseObj[key] = configMap.get(key);
    }
  }

  return NextResponse.json(responseObj);
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
      "api_key", "webhook_url", "webhook_secret",
      "whatsapp_enabled", "razorpay_key", "printer_configured",
      "email_configured", "sms_configured", "tally_configured",
      "delivery_configured", "ga4_configured", "google_reviews_configured",
      "gstin", "fssai", "restaurantEmail", "currency", "timezone", "invoicePrefix",
      "tagline", "accentColor", "googleReviewUrl",
      "businessHours",
      "cgstRate", "sgstRate", "igstRate", "serviceChargeRate", "isInclusivePricing", "roundToNearestRupee",
      "enableCash", "enableCard", "enableUpi",
      "qrType", "afterScanAction", "allowCustomerOrdering", "requireTableSelection", "showQrBranding",
      "printers",
      "soundAlerts", "emailAlerts", "orderReadySms",
      "waEnabled", "waTemplate", "waIncludeReviewCta", "waIncludeGstin", "waThankYou", "autoSendWaBill", "includePdfInvoice", "includeOrderAgainBtn"
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