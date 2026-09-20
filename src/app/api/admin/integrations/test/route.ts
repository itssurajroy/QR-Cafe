// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { integrationId, config } = await req.json();

    if (integrationId === "whatsapp") {
      const { input1: phoneNumberId, input2: accessToken } = config;
      if (!phoneNumberId || !accessToken) {
        return NextResponse.json({ error: "Missing Phone Number ID or Access Token" }, { status: 400 });
      }

      const res = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error?.message || "Invalid WhatsApp credentials" },
          { status: 400 }
        );
      }

      return NextResponse.json({ ok: true, message: "Handshake successful! WhatsApp API is reachable." });
    }

    if (integrationId === "razorpay") {
      const { input1: keyId, input2: keySecret } = config;
      if (!keyId || !keySecret) {
        return NextResponse.json({ error: "Missing Key ID or Key Secret" }, { status: 400 });
      }

      const authStr = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const res = await fetch(`https://api.razorpay.com/v1/orders`, {
        headers: {
          Authorization: `Basic ${authStr}`,
        },
      });

      // 401 means auth failed. 400 or 200 means auth succeeded (orders list might require pagination params, returning 400, but auth passed)
      // Actually, /orders with no params should return 200 with empty items or a paginated list.
      if (res.status === 401) {
        return NextResponse.json({ error: "Invalid Razorpay Key ID or Key Secret" }, { status: 401 });
      }

      return NextResponse.json({ ok: true, message: "Handshake successful! Razorpay API is authenticated." });
    }

    return NextResponse.json({ error: "Testing not implemented for this integration" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Test failed" }, { status: 500 });
  }
}
