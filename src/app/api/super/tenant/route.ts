import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const u = await getSessionUser();
  if (!u || u.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cafeId = req.nextUrl.searchParams.get("cafeId");
  if (!cafeId) return NextResponse.json({ error: "cafeId required" }, { status: 400 });

  const db = createSupabaseAdmin();
  const [
    { data: tenant },
    { data: cats },
    { data: items },
    { data: tables },
    { data: orders },
    { data: audit },
  ] = await Promise.all([
    db.from("restaurants").select("*").eq("id", cafeId).maybeSingle(),
    db.from("menu_categories").select("id,name,sort_order").eq("restaurant_id", cafeId).order("sort_order"),
    db.from("menu_items").select("id,category_id,name,price_paise,available,is_veg,hsn").eq("restaurant_id", cafeId).order("name"),
    db.from("restaurant_tables").select("id,label,seats,active").eq("restaurant_id", cafeId).order("label"),
    db.from("orders").select("id,order_number,status,payment_status,total_paise,created_at").eq("restaurant_id", cafeId).order("created_at", { ascending: false }).limit(50),
    db.from("audit_events").select("*").eq("restaurant_id", cafeId).order("created_at", { ascending: false }).limit(25),
  ]);

  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    tenant,
    categories: cats ?? [],
    items: items ?? [],
    tables: tables ?? [],
    orders: orders ?? [],
    audit: audit ?? [],
  });
}
