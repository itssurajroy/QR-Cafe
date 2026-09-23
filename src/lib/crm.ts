// Copyright (c) 2026 QRslice. All rights reserved.
import { SupabaseClient } from "@supabase/supabase-js";

type EarnResult = {
  pointsEarned: number;
  newTotalPoints: number;
  customerId?: string;
  already?: boolean;
};

function rpcJson(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return {};
}

/**
 * Atomic loyalty earn (A12). Delegates to p_earn_loyalty RPC so concurrent
 * settles cannot lose balance/spend/visit updates.
 */
export async function processCustomerLoyalty(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  customerName: string,
  totalPaise: number,
  orderId?: string,
  orderNumber?: string,
): Promise<EarnResult> {
  if (!customerPhone) return { pointsEarned: 0, newTotalPoints: 0 };

  const { data, error } = await db.rpc("p_earn_loyalty", {
    p_restaurant_id: restaurantId,
    p_phone: customerPhone,
    p_name: customerName || "",
    p_total_paise: totalPaise,
    p_order_id: orderId || null,
    p_order_number: orderNumber || null,
  });

  if (error) {
    console.error("[CRM] p_earn_loyalty failed:", error.message);
    throw new Error("Failed to process loyalty: " + error.message);
  }

  const payload = rpcJson(data);
  return {
    pointsEarned: Number(payload.pointsEarned ?? 0),
    newTotalPoints: Number(payload.newTotalPoints ?? 0),
    customerId: typeof payload.customerId === "string" ? payload.customerId : undefined,
    already: payload.already === true,
  };
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

/**
 * Atomic loyalty redeem (A12). Row-locked debit inside p_redeem_loyalty.
 */
export async function redeemCustomerPoints(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  pointsToRedeem: number,
  orderId?: string,
): Promise<boolean> {
  if (!customerPhone || pointsToRedeem <= 0) return false;

  const { error } = await db.rpc("p_redeem_loyalty", {
    p_restaurant_id: restaurantId,
    p_phone: customerPhone,
    p_points: pointsToRedeem,
    p_order_id: orderId || null,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("Insufficient")) throw new Error("Insufficient loyalty points");
    throw new Error("Failed to redeem points: " + msg);
  }

  return true;
}

/**
 * Atomic reverse for refunded/cancelled orders (A12).
 * Compensation sign: reverse ledger entry is always -abs(earn.points);
 * redeem restores with +abs(redeem.points). Idempotent per order.
 */
export async function reverseCustomerLoyalty(
  db: SupabaseClient,
  restaurantId: string,
  orderId: string,
  reason: string = "Order refund",
): Promise<void> {
  if (!orderId) return;

  const { error } = await db.rpc("p_reverse_loyalty", {
    p_restaurant_id: restaurantId,
    p_order_id: orderId,
    p_reason: reason,
  });

  if (error) {
    console.error("[CRM] p_reverse_loyalty failed:", error.message);
    throw new Error("Failed to reverse loyalty: " + error.message);
  }
}

/**
 * Atomic visit counter (B3). Does not award points or spend.
 */
export async function countCustomerVisit(
  db: SupabaseClient,
  restaurantId: string,
  customerPhone: string,
  customerName: string = "",
): Promise<{ customerId?: string; visitCount: number } | null> {
  if (!customerPhone) return null;

  const { data, error } = await db.rpc("p_count_visit", {
    p_restaurant_id: restaurantId,
    p_phone: customerPhone,
    p_name: customerName || "",
  });

  if (error) {
    console.error("[CRM] p_count_visit failed:", error.message);
    throw new Error("Failed to count visit: " + error.message);
  }

  const payload = rpcJson(data);
  return {
    customerId: typeof payload.customerId === "string" ? payload.customerId : undefined,
    visitCount: Number(payload.visitCount ?? 0),
  };
}
