// Copyright (c) 2026 QRslice. All rights reserved.
import { SupabaseClient } from "@supabase/supabase-js";

export async function processCustomerLoyalty(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  customerName: string,
  totalPaise: number,
  orderId?: string,
  orderNumber?: string,
) {
  if (!customerPhone) return { pointsEarned: 0, newTotalPoints: 0 };

  // 1 point per ₹100 spent (10,000 paise)
  const pointsEarned = Math.floor(totalPaise / 10000);

  const { data: cust } = await db
    .from("restaurant_customers")
    .select("id, name, total_spent_paise, loyalty_points, visit_count")
    .eq("restaurant_id", restaurantId)
    .eq("phone", customerPhone)
    .maybeSingle();

  let customerId = cust?.id;
  let newTotalPoints = pointsEarned;

  if (cust) {
    newTotalPoints += (cust.loyalty_points || 0);
    await db
      .from("restaurant_customers")
      .update({
        name: customerName || cust.name,
        total_spent_paise: (cust.total_spent_paise || 0) + totalPaise,
        loyalty_points: newTotalPoints,
        visit_count: (cust.visit_count || 0) + 1,
        last_visit_at: new Date().toISOString(),
      })
      .eq("id", cust.id);
  } else {
    const { data: inserted } = await db
      .from("restaurant_customers")
      .insert({
        restaurant_id: restaurantId,
        phone: customerPhone,
        name: customerName || "",
        loyalty_points: newTotalPoints,
        total_spent_paise: totalPaise,
        visit_count: 1,
      })
      .select("id")
      .single();
    customerId = inserted?.id;
  }

  // Record in immutable loyalty transaction ledger
  if (customerId && pointsEarned > 0) {
    try {
      await db.from("loyalty_transactions").insert({
        restaurant_id: restaurantId,
        customer_id: customerId,
        order_id: orderId || null,
        points: pointsEarned,
        balance_after: newTotalPoints,
        type: "earn",
        notes: orderNumber ? `Earned on order #${orderNumber}` : "Points earned from dine-in payment",
      });
    } catch (txErr) {
      console.error("[CRM] Failed to record loyalty earn transaction:", txErr);
    }
  }

  return { pointsEarned, newTotalPoints };
}

export async function getCustomerBalance(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
) {
  const { data: cust } = await db
    .from("restaurant_customers")
    .select("id, loyalty_points, name")
    .eq("restaurant_id", restaurantId)
    .eq("phone", customerPhone)
    .maybeSingle();

  return {
    id: cust?.id,
    points: cust?.loyalty_points || 0,
    name: cust?.name || "",
  };
}

export async function redeemCustomerPoints(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  pointsToRedeem: number,
  orderId?: string,
) {
  if (!customerPhone || pointsToRedeem <= 0) return false;

  const { data: cust } = await db
    .from("restaurant_customers")
    .select("id, loyalty_points")
    .eq("restaurant_id", restaurantId)
    .eq("phone", customerPhone)
    .maybeSingle();

  if (!cust || (cust.loyalty_points || 0) < pointsToRedeem) {
    throw new Error("Insufficient loyalty points");
  }

  const newPoints = (cust.loyalty_points || 0) - pointsToRedeem;

  const { error } = await db
    .from("restaurant_customers")
    .update({ loyalty_points: newPoints })
    .eq("id", cust.id);

  if (error) throw new Error("Failed to redeem points: " + error.message);

  // Record in immutable loyalty transaction ledger
  try {
    await db.from("loyalty_transactions").insert({
      restaurant_id: restaurantId,
      customer_id: cust.id,
      order_id: orderId || null,
      points: -pointsToRedeem,
      balance_after: newPoints,
      type: "redeem",
      notes: orderId ? `Redeemed on order ${orderId}` : "Points redeemed against bill",
    });
  } catch (txErr) {
    console.error("[CRM] Failed to record loyalty redeem transaction:", txErr);
  }

  await db.from("audit_events").insert({
    restaurant_id: restaurantId,
    entity: "customer_points",
    entity_id: cust.id,
    action: "points_redeemed",
    metadata: {
      adjustment: -pointsToRedeem,
      previous_balance: cust.loyalty_points,
      new_balance: newPoints,
      order_id: orderId,
      reason: "Redeemed on order",
    },
  });

  return true;
}

/**
 * Reverses loyalty points for refunded or cancelled orders
 */
export async function reverseCustomerLoyalty(
  db: SupabaseClient,
  restaurantId: string,
  orderId: string,
  reason: string = "Order refund",
) {
  if (!orderId) return;

  // Find earn transaction for this order
  const { data: earnTxs } = await db
    .from("loyalty_transactions")
    .select("id, customer_id, points")
    .eq("restaurant_id", restaurantId)
    .eq("order_id", orderId)
    .eq("type", "earn");

  if (!earnTxs || earnTxs.length === 0) return;

  for (const tx of earnTxs) {
    if (tx.points <= 0) continue;

    const { data: cust } = await db
      .from("restaurant_customers")
      .select("id, loyalty_points")
      .eq("id", tx.customer_id)
      .maybeSingle();

    if (!cust) continue;

    const newBalance = Math.max(0, (cust.loyalty_points || 0) - tx.points);

    await db
      .from("restaurant_customers")
      .update({ loyalty_points: newBalance })
      .eq("id", cust.id);

    await db.from("loyalty_transactions").insert({
      restaurant_id: restaurantId,
      customer_id: cust.id,
      order_id: orderId,
      points: -tx.points,
      balance_after: newBalance,
      type: "reverse",
      notes: `Reversal: ${reason} (Order ${orderId})`,
    });
  }
}
