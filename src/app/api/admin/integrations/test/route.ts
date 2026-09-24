// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";
import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "owner" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { integrationId, config } = await req.json();

    if (integrationId === "whatsapp") {
      const tenantId = auth.restaurantId;
      const linked = await new BaileysSessionStore().hasSession(tenantId);
      if (!linked) {
        return NextResponse.json({ ok: false, linked: false, message: "WhatsApp not linked. Scan QR to connect." });
      }
      const status = await new BaileysConnectionManager().getStatus(tenantId);
      if (!status.connected) {
        return NextResponse.json({ ok: false, linked: true, connected: false, message: "WhatsApp linked but not connected. Retrying..." });
      }
      return NextResponse.json({
        ok: true,
        linked: true,
        connected: true,
        phoneNumber: status.phoneNumber,
        message: `WhatsApp connected${status.phoneNumber ? ` as ${status.phoneNumber}` : ""}.`,
      });
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
