import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { istDayStart } from "@/lib/booking";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rl = rateLimit(`booking-lookup:${ip}`, 30, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many lookups", retryAfter: rl.retryAfter }, { status: 429 });
  const code = (new URL(req.url).searchParams.get("code") || "").toUpperCase().trim();
  if (!/^[A-Z0-9]{6}$/.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 422 });

  const db = createSupabaseAdmin();
  const { data: r } = await db
    .from("table_reservations")
    .select("id, table_ids, name, party_size, starts_at, ends_at, code, status, restaurant_id, restaurants(name, slug)")
    .eq("code", code)
    .gte("starts_at", istDayStart().toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!r) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, label, qr_token")
    .in("id", r.table_ids.length ? r.table_ids : ["00000000-0000-0000-0000-000000000000"]);
  return NextResponse.json({ ...r, table_labels: (tables ?? []).map((t) => t.label) });
}

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rl = rateLimit(`booking-cancel:${ip}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests", retryAfter: rl.retryAfter }, { status: 429 });
  const body = await req.json().catch(() => null);
  const code = String(body?.code || "").toUpperCase().trim();
  const phone = String(body?.phone || "").replace(/[^0-9+]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code) || phone.length < 7) {
    return NextResponse.json({ error: "Code and phone required" }, { status: 422 });
  }
  const db = createSupabaseAdmin();
  const { data: r } = await db
    .from("table_reservations")
    .select("id, status, starts_at")
    .eq("code", code)
    .eq("phone", phone)
    .gte("starts_at", istDayStart().toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!r || r.status !== "confirmed") {
    return NextResponse.json({ error: "Active booking not found" }, { status: 404 });
  }
  if (new Date(r.starts_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Too late to cancel online — please call the café" }, { status: 409 });
  }
  const { error } = await db.from("table_reservations").update({ status: "cancelled" }).eq("id", r.id);
  if (error) return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
