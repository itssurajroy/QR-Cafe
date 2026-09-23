// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";

const requireOwner = async () => {
  const auth = await getSessionUser();
  if (!auth?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "owner" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can manage WhatsApp" }, { status: 403 });
  }
  return auth;
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (auth instanceof Response) return auth;

  const manager = new BaileysConnectionManager();

  // Log out and wipe the DPU-side WhatsApp session
  await manager.disconnect(auth.restaurantId!);

  return NextResponse.json({ ok: true });
}