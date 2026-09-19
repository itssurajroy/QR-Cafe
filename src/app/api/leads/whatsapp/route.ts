// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limit: max 30 clicks per IP per 5 minutes to prevent spam
  const rl = rateLimit(`wa_click:${ip}`, 30, 300);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional
  }

  const {
    source = "floating_cta",
    page = "/",
    referrer = "",
  } = body;

  const userAgent = req.headers.get("user-agent") || "unknown";
  const clickId = `wa_lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const admin = createSupabaseAdmin();

  try {
    await admin.from("audit_events").insert({
      entity: "whatsapp_lead",
      entity_id: clickId,
      action: "clicked",
      metadata: {
        click_id: clickId,
        source: String(source).slice(0, 50),
        page: String(page).slice(0, 200),
        referrer: String(referrer).slice(0, 300),
        ip,
        user_agent: userAgent.slice(0, 200),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Non-blocking telemetry
    console.error("Failed to log WhatsApp lead click:", err);
  }

  return NextResponse.json({ ok: true, clickId });
}
