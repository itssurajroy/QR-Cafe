// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";
import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";

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

  const linked = await sessions.hasSession(auth.restaurantId!);
  const status = await manager.getStatus(auth.restaurantId!);

  return NextResponse.json({
    linked,
    connected: status.connected,
    phoneNumber: status.phoneNumber,
    lastSeenAt: status.lastSeen,
  });
}