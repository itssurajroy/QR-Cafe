import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || typeof token !== "string" || token.length < 3 || token.length > 64) {
    return NextResponse.json({ error: "Invalid status token format" }, { status: 400 });
  }
  const db = createSupabaseAdmin();

  // Core base columns present in all database environments
  const baseCols =
    "id, order_number, status, payment_status, created_at, total_paise, table_id, restaurant_id, order_items(id, item_name, quantity, line_total_paise)";

  let order: any = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

  if (isUuid) {
    // 1. Try by Order ID (UUID)
    const { data: byId } = await db
      .from("orders")
      .select(baseCols)
      .eq("id", token)
      .maybeSingle();

    if (byId) {
      order = byId;
    } else {
      // 2. Try by status_token (UUID)
      const { data: byStatusToken } = await db
        .from("orders")
        .select(baseCols)
        .eq("status_token", token)
        .maybeSingle();
      if (byStatusToken) order = byStatusToken;
    }
  }

  // 3. Fallback: Try by status_token or order_number
  if (!order) {
    const { data: byStatusToken } = await db
      .from("orders")
      .select(baseCols)
      .eq("status_token", token)
      .maybeSingle();

    if (byStatusToken) {
      order = byStatusToken;
    } else {
      const { data: byNumber } = await db
        .from("orders")
        .select(baseCols)
        .eq("order_number", token)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byNumber) order = byNumber;
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Safe lookup for delay columns if the migration has been applied
  let delayMinutes = 0;
  let delayReason = "";
  try {
    const { data: delayData } = await db
      .from("orders")
      .select("delay_minutes, delay_reason")
      .eq("id", order.id)
      .maybeSingle();
    if (delayData) {
      delayMinutes = (delayData as any).delay_minutes || 0;
      delayReason = (delayData as any).delay_reason || "";
    }
  } catch {
    /* ignore if delay columns do not exist */
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
    delay_minutes: delayMinutes,
    delay_reason: delayReason,
    total_paise: order.total_paise,
    table: tableLabel,
    qr_token: qrToken,
    restaurant_name: restaurantName,
    google_review_url: googleReviewUrl,
    items: order.order_items ?? [],
    created_at: order.created_at,
  });
}
