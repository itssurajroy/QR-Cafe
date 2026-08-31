import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || "";
  const action = searchParams.get("action") || "";
  const restaurantId = searchParams.get("restaurantId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 50;

  const db = createSupabaseAdmin();
  let query = db
    .from("audit_events")
    .select("*, restaurants(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (restaurantId) {
    query = query.eq("restaurant_id", restaurantId);
  }
  if (action) {
    query = query.eq("action", action);
  }
  if (from) {
    query = query.gte("created_at", from);
  }
  if (to) {
    query = query.lte("created_at", to);
  }
  if (q) {
    query = query.or(`entity.ilike.%${q}%,action.ilike.%${q}%`);
  }

  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;
  const { data: rows, count, error } = await query.range(fromIdx, toIdx);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    rows: rows ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
