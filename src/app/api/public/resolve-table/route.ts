// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/public/resolve-table
 *
 * Exchanges { restaurant_id, table_id } for the table's qr_token.
 * This keeps qr_token off the initial HTML payload — it is never shipped
 * in the public menu page; it is fetched lazily only when the customer
 * selects a specific table and is ready to order.
 *
 * Rate-limited to prevent enumeration of all table tokens.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate-limit: 30 requests per 60 s per IP to block token enumeration
  const rl = rateLimit(`resolve-table:${ip}`, 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { restaurant_id, table_id } = body as Record<string, unknown>;

  if (
    typeof restaurant_id !== "string" ||
    typeof table_id !== "string" ||
    !restaurant_id.trim() ||
    !table_id.trim()
  ) {
    return NextResponse.json(
      { error: "restaurant_id and table_id are required" },
      { status: 400 },
    );
  }

  const db = createSupabaseAdmin();

  // Only return the token for tables that are active and belong to the
  // specified restaurant (prevents cross-tenant token leakage).
  const { data: table, error } = await db
    .from("restaurant_tables")
    .select("qr_token")
    .eq("id", table_id)
    .eq("restaurant_id", restaurant_id)
    .eq("active", true)
    .single();

  if (error || !table) {
    return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
  }

  return NextResponse.json({ qr_token: table.qr_token });
}
