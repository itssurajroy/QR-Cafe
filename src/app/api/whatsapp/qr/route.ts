// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "owner" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can manage WhatsApp" }, { status: 403 });
  }

  const manager = new BaileysConnectionManager();
  const status = await manager.getStatus(auth.restaurantId);
  if (status.connected) {
    return NextResponse.json({ connected: true });
  }

  await manager.connect(auth.restaurantId, { autoReconnect: false });

  // Poll for QR up to 15s (Baileys emits qr via connection.update)
  const deadline = Date.now() + 15_000;
  let qrCode: string | null = null;
  while (Date.now() < deadline) {
    qrCode = await manager.getQRCode(auth.restaurantId);
    if (qrCode) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!qrCode) {
    return NextResponse.json({ error: "QR not yet available, retry shortly" }, { status: 503 });
  }

  const qrUrl = await QRCode.toDataURL(qrCode);
  return NextResponse.json({ qr: qrUrl });
}