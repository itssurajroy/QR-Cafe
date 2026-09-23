// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/pos-guard";
import { rateLimit } from "@/lib/rate-limit";
import { sendInvoiceEmail } from "@/lib/invoice-email";

const invoiceEmailSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  email: z.string().trim().email("Invalid email"),
});

/**
 * POS "Email invoice" — generates PDF server-side and sends via Resend.
 * Session + tenant required; light per-user rate limit to deter abuse.
 */
export async function POST(req: NextRequest) {
  const guard = await requireTenant();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const rl = rateLimit(`invoice-email:${user.userId}:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many email requests. Please wait a moment.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = invoiceEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { order_id, email } = parsed.data;
  const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
  const db = createSupabaseAdmin();

  const { data: order } = await db
    .from("orders")
    .select("id, restaurant_id, order_number")
    .eq("id", order_id)
    .eq("restaurant_id", user.restaurantId as string)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
  }

  try {
    const result = await sendInvoiceEmail({ orderId: order_id, to: email });
    if (!result.sent) {
      if (result.skipped === "email-provider-unconfigured") {
        return NextResponse.json(
          { error: "Email provider not configured. Set RESEND_API_KEY and EMAIL_FROM." },
          { status: 503 },
        );
      }
      if (result.skipped === "invalid-email") {
        return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
      }
      return NextResponse.json(
        { error: `Failed to send invoice email: ${result.skipped || "unknown error"}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, sent: true, to: result.to });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send invoice email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
