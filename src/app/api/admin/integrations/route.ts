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
  
  // Fetch integration status from platform_config or dedicated table
  // For now, derive from existing configuration
  const { data: config } = await db
    .from("platform_config")
    .select("key, value")
    .eq("restaurant_id", restaurantId)
    .in("key", ["whatsapp_enabled", "razorpay_key", "printer_configured", "email_configured", "sms_configured", "tally_configured", "delivery_configured", "ga4_configured", "google_reviews_configured"]);
  
  const configMap = new Map((config ?? []).map((c: any) => [c.key, c.value]));
  
  // Derive integration status from actual configuration
  const integrations = [
    {
      id: "whatsapp",
      name: "WhatsApp Cloud API",
      category: "communication" as const,
      status: configMap.get("whatsapp_enabled") === true ? "connected" : "not_connected",
      description: "Automated digital receipts, order tracking updates, and 1-click customer re-engagement.",
      connectedSince: configMap.get("whatsapp_enabled") === true ? "Active" : undefined,
      icon: "💬",
      docsUrl: "/admin/settings?category=whatsapp",
    },
    {
      id: "razorpay",
      name: "Payment Gateway (Razorpay / UPI)",
      category: "payment" as const,
      status: configMap.get("razorpay_key") ? "connected" : "not_connected",
      description: "Direct customer checkout via UPI QR, RuPay, Visa, Mastercard, and NetBanking.",
      connectedSince: configMap.get("razorpay_key") ? "Active" : undefined,
      icon: "💳",
      docsUrl: "/admin/settings?category=payments",
    },
    {
      id: "thermal_printer",
      name: "Thermal POS & KOT Printers",
      category: "hardware" as const,
      status: configMap.get("printer_configured") === true ? "connected" : "not_connected",
      description: "ESC/POS driver for 80mm / 58mm Bluetooth, USB OTG, and LAN receipt printing.",
      connectedSince: configMap.get("printer_configured") === true ? "Active" : undefined,
      icon: "🖨️",
      docsUrl: "/admin/settings?category=printers",
    },
    {
      id: "email",
      name: "Transactional Email (Resend / SendGrid)",
      category: "communication" as const,
      status: configMap.get("email_configured") === true ? "connected" : "action_required",
      description: "End-of-day sales reports, audit alerts, and manager shift reconciliations.",
      connectedSince: configMap.get("email_configured") === true ? "Active" : undefined,
      icon: "✉️",
      docsUrl: "/admin/settings?category=notifications",
    },
    {
      id: "sms",
      name: "SMS Gateway (Fast2SMS / Twilio)",
      category: "communication" as const,
      status: configMap.get("sms_configured") === true ? "connected" : "not_connected",
      description: "Fallback text message delivery for guest table bookings and order ready alerts.",
      icon: "📱",
    },
    {
      id: "tally",
      name: "Tally Prime & Zoho Books",
      category: "accounting" as const,
      status: configMap.get("tally_configured") === true ? "connected" : "not_connected",
      description: "Direct ledger sync of daily GST taxes, raw material invoices, and sales vouchers.",
      icon: "📊",
    },
    {
      id: "delivery",
      name: "Delivery Fleet (Dunzo / Shadowfax)",
      category: "logistics" as const,
      status: configMap.get("delivery_configured") === true ? "connected" : "not_connected",
      description: "Auto-dispatch riders for direct restaurant takeaway and delivery orders.",
      icon: "🛵",
    },
    {
      id: "google_analytics",
      name: "Google Analytics 4 (GA4)",
      category: "marketing" as const,
      status: configMap.get("ga4_configured") === true ? "connected" : "not_connected",
      description: "Track QR scan volume, table traffic, dish pageviews, and bounce rate.",
      icon: "📈",
    },
    {
      id: "google_reviews",
      name: "Google 5★ Reviews Funnel",
      category: "marketing" as const,
      status: configMap.get("google_reviews_configured") === true ? "connected" : "not_connected",
      description: "Route delighted diners directly from WhatsApp bills to your Google Maps listing.",
      connectedSince: configMap.get("google_reviews_configured") === true ? "Active" : undefined,
      icon: "⭐",
      docsUrl: "/admin/settings?category=branding",
    },
  ];
  
  return NextResponse.json({ ok: true, integrations });
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
    const { integrationId, status, config } = body;
    
    // Map integration IDs to platform_config keys
    const keyMap: Record<string, string> = {
      whatsapp: "whatsapp_enabled",
      razorpay: "razorpay_key",
      thermal_printer: "printer_configured",
      email: "email_configured",
      sms: "sms_configured",
      tally: "tally_configured",
      delivery: "delivery_configured",
      google_analytics: "ga4_configured",
      google_reviews: "google_reviews_configured",
    };
    
    const key = keyMap[integrationId];
    if (!key) return NextResponse.json({ error: "Invalid integration" }, { status: 400 });
    
    const value = status === "connected" ? true : false;
    
    await db
      .from("platform_config")
      .upsert({ key, value, restaurant_id: restaurantId, updated_at: new Date().toISOString() }, { onConflict: "key,restaurant_id" });
    
    // Also store additional config if provided
    if (config) {
      await db
        .from("platform_config")
        .upsert({ key: `${key}_config`, value: config, restaurant_id: restaurantId, updated_at: new Date().toISOString() }, { onConflict: "key,restaurant_id" });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update integration" }, { status: 500 });
  }
}