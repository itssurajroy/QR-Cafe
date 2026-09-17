// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();

  try {
    const body = await req.json();
    const { webhookUrl, secret } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL required" }, { status: 400 });
    }

    // Send test payload
    const testPayload = {
      event: "test.ping",
      created_at: new Date().toISOString(),
      data: {
        message: "Test webhook from QRslice",
        timestamp: Date.now(),
      },
    };

    // Create signature
    const payload = JSON.stringify(testPayload);
    const hmac = crypto.createHmac("sha256", secret || "whsec_test");
    const signature = hmac.update(payload).digest("hex");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-QRslice-Signature": `sha256=${signature}`,
          "X-QRslice-Event": "test.ping",
          "User-Agent": "QRslice-Webhooks/1.0",
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        return NextResponse.json({ ok: true, message: "Test webhook delivered successfully", status: res.status });
      } else {
        return NextResponse.json({ ok: false, error: `Webhook returned ${res.status}: ${res.statusText}` }, { status: 400 });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return NextResponse.json({ ok: false, error: "Webhook timeout (10s)" }, { status: 408 });
      }
      return NextResponse.json({ ok: false, error: `Network error: ${err.message}` }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test webhook" }, { status: 500 });
  }
}