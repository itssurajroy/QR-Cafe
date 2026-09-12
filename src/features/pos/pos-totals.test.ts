import { describe, it, expect } from "vitest";

export function calcTotals(subtotalPaise: number, discountPercent: number, flatDiscountRupees: string) {
  let discountPaise = 0;
  if (flatDiscountRupees && Number(flatDiscountRupees) > 0) {
    discountPaise = Math.min(Number(flatDiscountRupees) * 100, subtotalPaise);
  } else if (discountPercent > 0) {
    discountPaise = Math.round((subtotalPaise * discountPercent) / 100);
  }
  return { discountPaise, finalTotalPaise: Math.max(0, subtotalPaise - discountPaise) };
}

describe("pos totals", () => {
  it("flat discount wins over percent and clamps to subtotal", () => {
    expect(calcTotals(60000, 10, "1000").finalTotalPaise).toBe(0);
  });
  it("percent rounds to paise", () => {
    expect(calcTotals(10000, 5, "").discountPaise).toBe(500);
  });
  it("change due math", () => {
    const { finalTotalPaise } = calcTotals(63000, 0, "");
    expect(70000 - finalTotalPaise).toBe(7000);
  });
});
