// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";
import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";
import QRCode from "qrcode";

const requireOwner = async () => {
  const auth = await getSessionUser();
  if (!auth?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "owner" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can manage WhatsApp" }, { status: 403 });
  }
  return auth;
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireOwner();
  if (auth instanceof Response) return auth;

  const manager = new BaileysConnectionManager();
  const sessions = new BaileysSessionStore();

  // Emit connection to trigger QR if not yet connected
  await manager.connect(auth.restaurantId!, { autoReconnect: false });

  let qrCode: string;
  try {
    // Poll for QR code since waitForQr is not implemented
    let qr = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      qr = await manager.getQRCode(auth.restaurantId!);
      if (qr) break;
    }
    if (!qr) throw new Error("No QR");
    qrCode = await QRCode.toDataURL(qr);
  } catch (err) {
    // If no QR available yet, return raw string for client-side rendering
    const rawQr = await manager.getQRCode(auth.restaurantId!);
    qrCode = rawQr ?? "whatsapp-qr-placeholder";
  }

  return NextResponse.json({ qr: qrCode });
}