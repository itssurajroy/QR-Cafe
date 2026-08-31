import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { patchOrderSchema } from "@/lib/validation";

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [],
  rejected: [],
  cancelled: [],
};

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  unpaid: ["paid", "refunded"],
  paid: ["refunded", "unpaid"],
  refunded: ["unpaid"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = patchOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { status, payment_status } = parsed.data;

  // Staff may only advance kitchen status, never touch payments.
  if (user.role === "staff" && payment_status) {
    return NextResponse.json(
      { error: "Staff cannot change payment status" },
      { status: 403 },
    );
  }

  const admin = createSupabaseAdmin();

  // Load current order scoped strictly to the caller's restaurant
  const { data: order, error } = await admin
    .from("orders")
    .select("id, status, payment_status, restaurant_id")
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (status && status !== order.status) {
    if (!TRANSITIONS[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${order.status} to ${status}` },
        { status: 422 },
      );
    }
    updates.status = status;
  }

  if (payment_status && payment_status !== order.payment_status) {
    if (!PAYMENT_TRANSITIONS[order.payment_status]?.includes(payment_status)) {
      return NextResponse.json(
        { error: `Invalid payment status transition from ${order.payment_status} to ${payment_status}` },
        { status: 422 },
      );
    }
    updates.payment_status = payment_status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const { error: updErr } = await admin
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  await admin.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: order.restaurant_id,
    entity: "order",
    entity_id: id,
    action: "update",
    metadata: {
      ...updates,
      ip,
    },
  });

  return NextResponse.json({ ok: true, updates });
}
