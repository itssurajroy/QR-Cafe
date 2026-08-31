import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ error: "Invalid status token format" }, { status: 400 });
  }
  const db = createSupabaseAdmin();

  const { data: order, error } = await db
    .from("orders")
    .select(
      "order_number, status, payment_status, created_at, total_paise, table_id, restaurant_id, order_items(id, item_name, quantity, line_total_paise)",
    )
    .eq("status_token", token)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Fetch Table details safely
  let tableLabel = "Counter / Takeaway";
  let qrToken: string | null = null;
  if (order.table_id) {
    const { data: table } = await db
      .from("restaurant_tables")
      .select("label, qr_token")
      .eq("id", order.table_id)
      .maybeSingle();
    if (table) {
      tableLabel = table.label;
      qrToken = table.qr_token;
    }
  }

  // Fetch Restaurant details safely
  let restaurantName = "Our Café";
  let googleReviewUrl: string | null = null;
  if (order.restaurant_id) {
    const { data: rest } = await db
      .from("restaurants")
      .select("name, google_review_url")
      .eq("id", order.restaurant_id)
      .maybeSingle();
    if (rest) {
      restaurantName = rest.name;
      googleReviewUrl = rest.google_review_url;
    }
  }

  return NextResponse.json({
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    total_paise: order.total_paise,
    table: tableLabel,
    qr_token: qrToken,
    restaurant_name: restaurantName,
    google_review_url: googleReviewUrl,
    items: order.order_items ?? [],
    created_at: order.created_at,
  });
}
