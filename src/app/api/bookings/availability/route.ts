// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { overlaps, istDayStart, BOOKING_DEFAULT_MIN, BOOKING_GRACE_MIN } from "@/lib/booking";

export const dynamic = "force-dynamic";

const schema = z.object({
  slug: z.string().min(2),
  starts_at: z.string().datetime(),
  duration_min: z.number().int().min(30).max(240).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const { slug, starts_at, duration_min } = parsed.data;
  const starts = new Date(starts_at);
  const duration = duration_min ?? BOOKING_DEFAULT_MIN;
  const ends = new Date(starts.getTime() + duration * 60000);

  const db = createSupabaseAdmin();
  const { data: restaurant } = await db
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Café not found" }, { status: 404 });
  }

  // Fetch all active tables
  const { data: tables, error: tablesErr } = await db
    .from("restaurant_tables")
    .select("id, label, seats")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true)
    .order("label", { ascending: true });

  if (tablesErr || !tables) {
    return NextResponse.json({ error: "Could not fetch tables" }, { status: 500 });
  }

  // Cleanup expired
  const graceCutoff = new Date(Date.now() - BOOKING_GRACE_MIN * 60000).toISOString();
  await db.from("table_reservations").update({ status: "expired" })
    .eq("restaurant_id", restaurant.id).eq("status", "confirmed").lt("ends_at", graceCutoff);

  // Fetch existing bookings for the day to check overlaps
  const now = new Date();
  const { data: existing } = await db
    .from("table_reservations")
    .select("table_ids, starts_at, ends_at")
    .eq("restaurant_id", restaurant.id)
    .in("status", ["confirmed", "pending"])
    .gte("starts_at", istDayStart(now).toISOString());

  const bookings = existing ?? [];

  // Determine availability for each table
  const availability = tables.map((table) => {
    // Check if any overlapping booking uses this table
    const isBooked = bookings.some((b) => {
      if (!b.table_ids.includes(table.id)) return false;
      return overlaps(starts, ends, new Date(b.starts_at), new Date(b.ends_at));
    });

    return {
      id: table.id,
      label: table.label,
      seats: table.seats,
      available: !isBooked,
    };
  });

  return NextResponse.json({ tables: availability }, { status: 200 });
}
