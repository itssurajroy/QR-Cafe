import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status_token, rating, feedback, compliments = [] } = body;
  if (!status_token || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("id, restaurant_id, table_id, order_number")
    .eq("status_token", status_token)
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Record feedback into audit_events for admin insights
  const { error: aErr } = await admin.from("audit_events").insert({
    restaurant_id: order.restaurant_id,
    entity: "customer_feedback",
    entity_id: order.id,
    action: "submit",
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      rating,
      feedback: feedback?.trim() || "",
      compliments,
      submitted_at: new Date().toISOString(),
    },
  });

  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Thank you for your feedback!" });
}
