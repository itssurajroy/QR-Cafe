import { describe, it, expect } from "vitest";

export function validateCustomItem(name: string, price: string) {
  if (!name.trim() || !price || Number.isNaN(Number(price)) || Number(price) <= 0) return "Please enter valid item name and price";
  if (name.trim().length > 80) return "Item name too long (max 80)";
  if (Number(price) > 100000) return "Price too high (max ₹100000)";
  return null;
}

describe("custom item validation", () => {
  it("rejects empty name", () => {
    expect(validateCustomItem("  ", "50")).toBe("Please enter valid item name and price");
  });
  it("rejects zero price", () => {
    expect(validateCustomItem("Extra Cheese", "0")).toBe("Please enter valid item name and price");
  });
  it("rejects absurd price", () => {
    expect(validateCustomItem("Gold Leaf Dosa", "200000")).toBe("Price too high (max ₹100000)");
  });
  it("rejects non-numeric price", () => {
    expect(validateCustomItem("Extra Cheese", "abc")).toBe("Please enter valid item name and price");
  });
  it("accepts valid input", () => {
    expect(validateCustomItem("Extra Cheese", "50")).toBe(null);
  });
});
