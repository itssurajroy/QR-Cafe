import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  overlaps, pickTables, genBookingCode, withinHours, istDayKey, isSameDayIST, istDayStart, suggestNextSlot,
  BOOKING_DEFAULT_MIN, BOOKING_MAX_PER_PHONE_PER_DAY, BOOKING_GRACE_MIN,
} from "@/lib/booking";

const schema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  party_size: z.number().int().min(1).max(60),
  starts_at: z.string().datetime(),
  duration_min: z.number().int().min(30).max(240).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const input = parsed.data;
  const starts = new Date(input.starts_at);
  const now = new Date();
  if (!isSameDayIST(starts, now)) {
    return NextResponse.json({ error: "Same-day bookings only" }, { status: 422 });
  }
  const rl = rateLimit(`booking:${input.phone}:${istDayKey(now)}`, BOOKING_MAX_PER_PHONE_PER_DAY, 86400);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many bookings for this number today", retryAfter: rl.retryAfter }, { status: 429 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rlIp = rateLimit(`booking-ip:${ip}:${istDayKey(now)}`, 20, 86400);
  if (!rlIp.ok) {
    return NextResponse.json({ error: "Too many bookings from this device today", retryAfter: rlIp.retryAfter }, { status: 429 });
  }

  const db = createSupabaseAdmin();
  const { data: restaurant } = await db
    .from("restaurants")
    .select("id, open_time, close_time")
    .eq("slug", input.slug)
    .maybeSingle();
  if (!restaurant) return NextResponse.json({ error: "Café not found" }, { status: 404 });

  const graceCutoff = new Date(Date.now() - BOOKING_GRACE_MIN * 60000).toISOString();
  await db.from("table_reservations").update({ status: "expired" })
    .eq("restaurant_id", restaurant.id).eq("status", "confirmed").lt("ends_at", graceCutoff);

  const ends = new Date(starts.getTime() + (input.duration_min ?? BOOKING_DEFAULT_MIN) * 60000);
  const openH = restaurant.open_time ?? "11:00";
  const closeH = restaurant.close_time ?? "23:00";
  if (!withinHours(starts, ends, openH, closeH)) {
    return NextResponse.json({ error: `Outside opening hours (${openH}–${closeH})` }, { status: 422 });
  }

  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, seats")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true);
  const picked = pickTables(tables ?? [], input.party_size);
  if (!picked) return NextResponse.json({ error: "No table fits this party size" }, { status: 409 });

  const { data: existing } = await db
    .from("table_reservations")
    .select("table_ids, starts_at, ends_at")
    .eq("restaurant_id", restaurant.id)
    .in("status", ["confirmed", "pending"])
    .gte("starts_at", istDayStart(now).toISOString());
  for (const r of existing ?? []) {
    if (!r.table_ids.some((t: string) => picked.includes(t))) continue;
    if (overlaps(starts, ends, new Date(r.starts_at), new Date(r.ends_at))) {
      const durationMin = input.duration_min ?? BOOKING_DEFAULT_MIN;
      const suggested = suggestNextSlot(starts, durationMin, existing ?? []);
      return NextResponse.json({ error: "Tables busy in that slot", suggested_starts_at: suggested ? suggested.toISOString() : null }, { status: 409 });
    }
  }

  const day = istDayKey(starts);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genBookingCode();
    const { data, error } = await db
      .from("table_reservations")
      .insert({
        restaurant_id: restaurant.id, table_ids: picked, name: input.name.trim(),
        phone: input.phone.replace(/[^0-9+]/g, ""), party_size: input.party_size,
        starts_at: starts.toISOString(), ends_at: ends.toISOString(), code, day, status: input.party_size >= 9 ? "pending" : "confirmed",
      })
      .select("id, code, table_ids, starts_at, ends_at, status")
      .single();
    if (!error && data) return NextResponse.json(data, { status: 201 });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: "Booking failed, please try again" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not issue booking code" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const { getSessionUser } = await import("@/lib/auth");
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
  const db = createSupabaseAdmin();
  const graceCutoff = new Date(Date.now() - BOOKING_GRACE_MIN * 60000).toISOString();
  await db
    .from("table_reservations")
    .update({ status: "expired" })
    .eq("restaurant_id", restaurantId)
    .eq("status", "confirmed")
    .lt("ends_at", graceCutoff);
  const { data, error } = await db
    .from("table_reservations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("starts_at", istDayStart().toISOString())
    .order("starts_at");
  if (error) return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 });
  return NextResponse.json(data);
}
