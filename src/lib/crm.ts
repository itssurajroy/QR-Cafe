import { SupabaseClient } from "@supabase/supabase-js";

export async function processCustomerLoyalty(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  customerName: string,
  totalPaise: number
) {
  if (!customerPhone) return { pointsEarned: 0, newTotalPoints: 0 };

  // 1 point per ₹100 spent
  const pointsEarned = Math.floor(totalPaise / 10000);

  const { data: cust } = await db
    .from("restaurant_customers")
    .select("id, name, total_spent_paise, loyalty_points, visit_count")
    .eq("restaurant_id", restaurantId)
    .eq("phone", customerPhone)
    .maybeSingle();

  let newTotalPoints = pointsEarned;

  if (cust) {
    newTotalPoints += cust.loyalty_points;
    await db
      .from("restaurant_customers")
      .update({
        name: customerName || cust.name,
        total_spent_paise: cust.total_spent_paise + totalPaise,
        loyalty_points: newTotalPoints,
        visit_count: cust.visit_count + 1,
        last_visit_at: new Date().toISOString(),
      })
      .eq("id", cust.id);
  } else {
    await db.from("restaurant_customers").insert({
      restaurant_id: restaurantId,
      phone: customerPhone,
      name: customerName || "",
      loyalty_points: newTotalPoints,
      total_spent_paise: totalPaise,
      visit_count: 1,
    });
  }

  return { pointsEarned, newTotalPoints };
}

export async function getCustomerBalance(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string
) {
  const { data: cust } = await db
    .from("restaurant_customers")
    .select("loyalty_points, name")
    .eq("restaurant_id", restaurantId)
    .eq("phone", customerPhone)
    .maybeSingle();
  
  return {
    points: cust?.loyalty_points || 0,
    name: cust?.name || "",
  };
}

export async function redeemCustomerPoints(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  pointsToRedeem: number,
  orderId: string
) {
  if (!customerPhone || pointsToRedeem <= 0) return false;

  const { data: cust } = await db
    .from("restaurant_customers")
    .select("id, loyalty_points")
    .eq("restaurant_id", restaurantId)
    .eq("phone", customerPhone)
    .maybeSingle();

  if (!cust || cust.loyalty_points < pointsToRedeem) {
    throw new Error("Insufficient loyalty points");
  }

  const newPoints = cust.loyalty_points - pointsToRedeem;

  const { error } = await db
    .from("restaurant_customers")
    .update({ loyalty_points: newPoints })
    .eq("id", cust.id);

  if (error) throw new Error("Failed to redeem points: " + error.message);

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
