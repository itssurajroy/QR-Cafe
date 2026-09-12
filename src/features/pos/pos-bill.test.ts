import { describe, it, expect } from "vitest";

export function billLineTotal(unitPricePaise: number, quantity: number) {
  return (unitPricePaise * quantity) / 100;
}

describe("bill receipt math", () => {
  it("renders line total with two decimals", () => {
    expect(billLineTotal(22000, 2).toFixed(2)).toBe("440.00");
  });
  it("handles missing price as zero", () => {
    expect(billLineTotal(0, 3).toFixed(2)).toBe("0.00");
  });
});
