// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;
  const userId = auth.userId;

  try {
    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
    }

    // Create support ticket in audit_events or dedicated table
    const { data: ticket, error } = await db
      .from("audit_events")
      .insert({
        actor_id: userId,
        restaurant_id: restaurantId,
        entity: "support_ticket",
        entity_id: `ticket_${Date.now()}`,
        action: "support_ticket_created",
        metadata: {
          subject,
          category: category || "technical",
          message,
          status: "open",
          priority: "high",
        },
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      ticketId: `TICK-${ticket.id.slice(-6)}`,
      message: "Support ticket created successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create ticket" }, { status: 500 });
  }
}