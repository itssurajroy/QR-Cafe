// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({ action: z.enum(["cancel", "no_show", "seat", "accept"]) });

const STATUS: Record<string, string> = { cancel: "cancelled", no_show: "no_show", seat: "seated", accept: "confirmed" };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let restaurantId: string | null;
  if (user.role === "super_admin") {
    const param = new URL(req.url).searchParams.get("restaurant_id");
    if (!param) return NextResponse.json({ error: "restaurant_id required" }, { status: 400 });
    restaurantId = param;
  } else {
    if (!user.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    restaurantId = user.restaurantId;
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 422 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  if (parsed.data.action === "accept") {
    const { data: existing, error: fetchError } = await db
      .from("table_reservations")
      .select("id, status")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .single();
    if (fetchError || !existing) return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 });
    if (existing.status !== "pending") return NextResponse.json({ error: "Only pending bookings can be accepted" }, { status: 409 });
  }
  const { data, error } = await db
    .from("table_reservations")
    .update({ status: STATUS[parsed.data.action] })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 });
  await db.from("audit_events").insert({
    restaurant_id: restaurantId, actor_id: user.userId,
    entity: "reservation", entity_id: id, action: parsed.data.action, metadata: {},
  });
  return NextResponse.json(data);
}
