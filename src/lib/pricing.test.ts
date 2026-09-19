// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import {
  calculateItemUnitPrice,
  calculateItemLineTotal,
  calculateAuthoritativePricing,
} from "./pricing";

describe("Authoritative Pricing Engine", () => {
  it("satisfies the mandatory pricing regression test", () => {
    // Base: ₹200 (20000 paise)
    const basePrice = 20000;
    // Full portion: +₹50 (5000 paise)
    const portionDelta = 5000;
    // Addon A: +₹30 (3000 paise), Addon B: +₹20 (2000 paise)
    const modifiers = [
      { option_name: "Addon A", price_delta_paise: 3000 },
      { option_name: "Addon B", price_delta_paise: 2000 },
    ];
    // Quantity: 2
    const quantity = 2;

    const unitPrice = calculateItemUnitPrice(basePrice, portionDelta, modifiers);
    expect(unitPrice).toBe(30000); // ₹300

    const lineTotal = calculateItemLineTotal(unitPrice, quantity);
    expect(lineTotal).toBe(60000); // ₹600

    // Full pricing calculation
    const pricing = calculateAuthoritativePricing({
      items: [
        {
          menu_item_id: "00000000-0000-0000-0000-000000000001",
          item_name: "Special Biryani",
          base_price_paise: basePrice,
          portion_name: "Full Portion",
          portion_delta_paise: portionDelta,
          modifiers,
          quantity,
        },
      ],
    });

    expect(pricing.items[0].unit_price_paise).toBe(30000);
    expect(pricing.items[0].line_total_paise).toBe(60000);
    expect(pricing.subtotal_paise).toBe(60000);
    expect(pricing.total_paise).toBe(60000);
    expect(pricing.snapshot.items[0].unit_price_paise).toBe(30000);
    expect(pricing.snapshot.items[0].line_total_paise).toBe(60000);
  });

  it("accurately computes 5% GST on net subtotal", () => {
    const pricing = calculateAuthoritativePricing({
      items: [
        {
          menu_item_id: "00000000-0000-0000-0000-000000000001",
          base_price_paise: 100000, // ₹1,000
          quantity: 1,
        },
      ],
      tax_rate_percent: 5,
    });

    expect(pricing.subtotal_paise).toBe(100000);
    expect(pricing.tax_paise).toBe(5000); // ₹50
    expect(pricing.total_paise).toBe(105000); // ₹1,050
  });

  it("properly caps loyalty point redemption at 25% of subtotal", () => {
    const pricing = calculateAuthoritativePricing({
      items: [
        {
          menu_item_id: "00000000-0000-0000-0000-000000000001",
          base_price_paise: 40000, // ₹400
          quantity: 1,
        },
      ],
      loyalty_points_to_redeem: 200, // ₹200 requested, but 25% cap of ₹400 is ₹100 (10000 paise)
    });

    expect(pricing.subtotal_paise).toBe(40000);
    expect(pricing.discount_paise).toBe(10000); // Capped at ₹100
    expect(pricing.total_paise).toBe(30000); // ₹300
  });

  it("handles rounding to nearest rupee", () => {
    const pricing = calculateAuthoritativePricing({
      items: [
        {
          menu_item_id: "00000000-0000-0000-0000-000000000001",
          base_price_paise: 10550, // ₹105.50
          quantity: 1,
        },
      ],
      round_to_nearest_rupee: true,
    });

    // 10550 rounds to 10600 (+50 paise)
    expect(pricing.rounding_paise).toBe(50);
    expect(pricing.total_paise).toBe(10600);
  });
});
