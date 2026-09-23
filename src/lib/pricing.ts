// Copyright (c) 2026 QRslice. All rights reserved.

export interface PricingModifierInput {
  option_name: string;
  price_delta_paise: number;
  quantity?: number;
}

export interface PricingItemInput {
  menu_item_id: string;
  item_name?: string;
  base_price_paise: number;
  portion_name?: string;
  portion_delta_paise?: number;
  modifiers?: PricingModifierInput[];
  quantity: number;
  notes?: string;
  hsn?: string | null;
}

export interface CalculatedItemSnapshot {
  menu_item_id: string;
  item_name: string;
  base_price_paise: number;
  portion_name?: string;
  portion_delta_paise: number;
  modifiers: Array<{
    option_name: string;
    price_delta_paise: number;
    quantity: number;
  }>;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
  notes: string;
  hsn?: string | null;
}

export interface PricingSnapshot {
  version: 1;
  created_at: string;
  subtotal_paise: number;
  discount_paise: number;
  net_subtotal_paise: number;
  tax_rate_percent: number;
  tax_paise: number;
  rounding_paise: number;
  total_paise: number;
  items: CalculatedItemSnapshot[];
}

export interface PricingCalculationOptions {
  items: PricingItemInput[];
  discount_paise?: number;
  loyalty_points_to_redeem?: number;
  tax_rate_percent?: number;
  round_to_nearest_rupee?: boolean;
}

/**
 * Calculates item unit price authoritative server-side:
 * Unit = base + portion_delta + sum(modifier_delta * modifier_quantity)
 *
 * A3/A6 hardening: portion_delta and modifier deltas are clamped to >= 0 so a
 * negative client-supplied delta can never reduce the unit price below base.
 * (The order route also rejects negative/excessive portion deltas outright.)
 */
export function calculateItemUnitPrice(
  basePricePaise: number,
  portionDeltaPaise: number = 0,
  modifiers: PricingModifierInput[] = [],
): number {
  const modTotal = modifiers.reduce((acc, m) => {
    const qty = m.quantity !== undefined && m.quantity > 0 ? m.quantity : 1;
    return acc + Math.max(0, m.price_delta_paise) * qty;
  }, 0);
  const safePortionDelta = Math.max(0, portionDeltaPaise || 0);
  return Math.max(0, basePricePaise + safePortionDelta + modTotal);
}

/**
 * Calculates item line total:
 * Line = Unit * item_quantity
 */
export function calculateItemLineTotal(
  unitPricePaise: number,
  quantity: number,
): number {
  return unitPricePaise * Math.max(1, quantity);
}

/**
 * Authoritative Server-Side Pricing Engine
 * Never trusts client-sent totals, hidden fields, or URL parameters.
 */
export function calculateAuthoritativePricing(
  options: PricingCalculationOptions,
): {
  subtotal_paise: number;
  discount_paise: number;
  net_subtotal_paise: number;
  tax_rate_percent: number;
  tax_paise: number;
  rounding_paise: number;
  total_paise: number;
  items: CalculatedItemSnapshot[];
  snapshot: PricingSnapshot;
} {
  const {
    items,
    discount_paise = 0,
    loyalty_points_to_redeem = 0,
    tax_rate_percent = 0,
    round_to_nearest_rupee = false,
  } = options;

  let subtotal = 0;
  const calculatedItems: CalculatedItemSnapshot[] = [];

  for (const it of items) {
    const qty = Math.max(1, it.quantity || 1);
    // A3: clamp negative portion deltas so they never reduce the unit price.
    const portionDelta = Math.max(0, it.portion_delta_paise || 0);
    const sanitizedMods = (it.modifiers || []).map((m) => ({
      option_name: m.option_name,
      price_delta_paise: Math.max(0, m.price_delta_paise || 0),
      quantity: m.quantity !== undefined && m.quantity > 0 ? m.quantity : 1,
    }));

    const unitPrice = calculateItemUnitPrice(
      it.base_price_paise,
      portionDelta,
      sanitizedMods,
    );
    const lineTotal = calculateItemLineTotal(unitPrice, qty);

    subtotal += lineTotal;
    calculatedItems.push({
      menu_item_id: it.menu_item_id,
      item_name: it.item_name || "Item",
      base_price_paise: it.base_price_paise,
      portion_name: it.portion_name,
      portion_delta_paise: portionDelta,
      modifiers: sanitizedMods,
      unit_price_paise: unitPrice,
      quantity: qty,
      line_total_paise: lineTotal,
      notes: it.notes || "",
      hsn: it.hsn || null,
    });
  }

  // Loyalty points conversion (1 point = 1 rupee = 100 paise), cap at 25% of subtotal
  const maxLoyaltyPaise = Math.floor(subtotal * 0.25);
  const requestedLoyaltyPaise = Math.max(0, loyalty_points_to_redeem) * 100;
  const effectiveLoyaltyPaise = Math.min(requestedLoyaltyPaise, maxLoyaltyPaise);

  // A6: round client discount to integer paise before clamping to subtotal.
  const safeDiscountPaise = Math.round(Math.max(0, discount_paise));
  const totalDiscountPaise = Math.min(
    subtotal,
    safeDiscountPaise + effectiveLoyaltyPaise,
  );
  const netSubtotalPaise = Math.max(0, subtotal - totalDiscountPaise);

  // Tax computation
  const safeTaxRate = Math.max(0, tax_rate_percent || 0);
  const rawTaxPaise = Math.round((netSubtotalPaise * safeTaxRate) / 100);

  let rawTotal = netSubtotalPaise + rawTaxPaise;
  let roundingPaise = 0;

  if (round_to_nearest_rupee) {
    // Round to nearest 100 paise (₹1)
    const rounded = Math.round(rawTotal / 100) * 100;
    roundingPaise = rounded - rawTotal;
    rawTotal = rounded;
  }

  const finalTotalPaise = Math.max(0, rawTotal);

  const snapshot: PricingSnapshot = {
    version: 1,
    created_at: new Date().toISOString(),
    subtotal_paise: subtotal,
    discount_paise: totalDiscountPaise,
    net_subtotal_paise: netSubtotalPaise,
    tax_rate_percent: safeTaxRate,
    tax_paise: rawTaxPaise,
    rounding_paise: roundingPaise,
    total_paise: finalTotalPaise,
    items: calculatedItems,
  };

  return {
    subtotal_paise: subtotal,
    discount_paise: totalDiscountPaise,
    net_subtotal_paise: netSubtotalPaise,
    tax_rate_percent: safeTaxRate,
    tax_paise: rawTaxPaise,
    rounding_paise: roundingPaise,
    total_paise: finalTotalPaise,
    items: calculatedItems,
    snapshot,
  };
}
