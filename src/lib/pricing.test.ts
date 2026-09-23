// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  calculateAuthoritativePricing,
  calculateItemLineTotal,
  calculateItemUnitPrice,
} from "./pricing";

describe("calculateItemUnitPrice (A3/A6)", () => {
  it("computes base + portion + modifier deltas", () => {
    expect(
      calculateItemUnitPrice(10000, 5000, [
        { option_name: "extra cheese", price_delta_paise: 2000, quantity: 2 },
      ]),
    ).toBe(10000 + 5000 + 4000);
  });

  it("clamps negative portion delta so unit never drops below base", () => {
    expect(calculateItemUnitPrice(10000, -5000, [])).toBe(10000);
  });

  it("clamps negative modifier deltas", () => {
    expect(
      calculateItemUnitPrice(10000, 0, [{ option_name: "x", price_delta_paise: -9999 }]),
    ).toBe(10000);
  });

  it("never returns a negative unit price", () => {
    expect(calculateItemUnitPrice(0, -100, [])).toBe(0);
  });
});

describe("calculateItemLineTotal", () => {
  it("multiplies unit by quantity with min qty 1", () => {
    expect(calculateItemLineTotal(500, 3)).toBe(1500);
    expect(calculateItemLineTotal(500, 0)).toBe(500);
  });
});

describe("calculateAuthoritativePricing (A3/A6)", () => {
  const baseItem = {
    menu_item_id: "11111111-1111-4111-8111-111111111111",
    item_name: "Paneer Tikka",
    base_price_paise: 20000,
    quantity: 2,
  };

  it("rejects (clamps) negative portion delta in snapshot", () => {
    const result = calculateAuthoritativePricing({
      items: [{ ...baseItem, portion_delta_paise: -99999 }],
      tax_rate_percent: 5,
    });
    expect(result.items[0].portion_delta_paise).toBe(0);
    expect(result.items[0].unit_price_paise).toBe(20000);
    expect(result.subtotal_paise).toBe(40000);
  });

  it("rounds fractional discount to integer paise", () => {
    const result = calculateAuthoritativePricing({
      items: [{ ...baseItem, quantity: 1 }],
      discount_paise: 100.6,
      tax_rate_percent: 0,
    });
    expect(result.discount_paise).toBe(101);
    expect(Number.isInteger(result.discount_paise)).toBe(true);
  });

  it("never lets discount exceed subtotal", () => {
    const result = calculateAuthoritativePricing({
      items: [{ ...baseItem, quantity: 1 }],
      discount_paise: 999999,
      tax_rate_percent: 0,
    });
    expect(result.discount_paise).toBe(20000);
    expect(result.total_paise).toBe(0);
  });

  it("caps loyalty redemption at 25% of subtotal", () => {
    // 100 points requested = ₹100 = 10000 paise; 25% of 20000 = 5000
    const result = calculateAuthoritativePricing({
      items: [{ ...baseItem, quantity: 1 }],
      loyalty_points_to_redeem: 100,
      tax_rate_percent: 0,
    });
    expect(result.discount_paise).toBe(5000);
    expect(result.total_paise).toBe(15000);
  });

  it("computes tax on discounted subtotal", () => {
    const result = calculateAuthoritativePricing({
      items: [{ ...baseItem, quantity: 1 }],
      discount_paise: 0,
      tax_rate_percent: 5,
    });
    expect(result.net_subtotal_paise).toBe(20000);
    expect(result.tax_paise).toBe(1000);
    expect(result.total_paise).toBe(21000);
  });

  it("A4: client totals are ignored — only inputs feed the calculation", () => {
    // There is no "client total" parameter: the engine recomputes from items only.
    const result = calculateAuthoritativePricing({
      items: [{ ...baseItem, quantity: 3 }],
      tax_rate_percent: 0,
    });
    expect(result.total_paise).toBe(60000);
    expect(result.snapshot.version).toBe(1);
    expect(result.snapshot.items).toHaveLength(1);
  });
});
