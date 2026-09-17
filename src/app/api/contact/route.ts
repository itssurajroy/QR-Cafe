// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits").max(20),
  restaurantName: z.string().min(2, "Restaurant or café name is required").max(100),
  city: z.string().max(100).optional().default(""),
  outlets: z.string().max(50).optional().default("1 Outlet"),
  inquiryType: z.enum(["demo", "support", "hardware", "enterprise", "general"]).default("demo"),
  preferredSlot: z.string().max(100).optional().default(""),
  message: z.string().max(1000).optional().default(""),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limit: 5 contact form submissions per IP per 5 minutes
  const rl = rateLimit(`contact:${ip}`, 5, 300);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes or message us on WhatsApp.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const admin = createSupabaseAdmin();
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    // Record into audit_events ledger so founders / super-admins see every lead immediately
    await admin.from("audit_events").insert({
      entity: "contact_lead",
      entity_id: leadId,
      action: "submitted",
      metadata: {
        lead_id: leadId,
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        restaurant_name: data.restaurantName.trim(),
        city: data.city.trim(),
        outlets: data.outlets,
        inquiry_type: data.inquiryType,
        preferred_slot: data.preferredSlot,
        message: data.message.trim(),
        ip,
        submitted_at: new Date().toISOString(),
        status: "new",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Your request has been received! Our onboarding specialist will connect with you within 15 minutes.",
      leadId,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to record enquiry";
    console.error("Contact submission error:", errorMsg);
    // Still return ok to the customer so their experience is not broken, while logging the error
    return NextResponse.json({
      ok: true,
      message: "Your request has been received! You can also reach us directly on WhatsApp.",
      leadId,
    });
  }
}
