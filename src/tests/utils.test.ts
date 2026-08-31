/**
 * QR Café — Utility Functions Unit Tests
 * Run with: npx vitest run
 */

import { describe, it, expect } from "vitest";
import {
  paise,
  formatPaise,
  formatRupees,
  paiseToRupees,
  rupeesToPaise,
  calculateTax,
  calculateTotal,
  formatElapsed,
  formatCountdown,
  isOrderPaid,
  isOrderServed,
  isOrderActive,
  getOrderStatusLabel,
  getCategoryEmoji,
  getPrepTime,
  getStarRating,
  truncate,
  generateSlug,
  getUrgencyColor,
} from "../lib/utils";

// ─── Currency ─────────────────────────────────────────────────────────────────

describe("paise()", () => {
  it("formats integer paise as ₹ string", () => {
    expect(paise(10000)).toBe("₹100");
    expect(paise(50000)).toBe("₹500");
    expect(paise(150)).toBe("₹1.5");
  });

  it("handles zero", () => {
    expect(paise(0)).toBe("₹0");
  });

  it("handles negative gracefully (clamps to 0)", () => {
    expect(paise(-100)).toBe("₹0");
  });

  it("alias formatPaise works", () => {
    expect(formatPaise(10000)).toBe("₹100");
  });
});

describe("formatRupees()", () => {
  it("formats whole rupees", () => {
    expect(formatRupees(500)).toBe("₹500");
  });
});

describe("paiseToRupees()", () => {
  it("converts correctly", () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(550)).toBe(5.5);
  });
});

describe("rupeesToPaise()", () => {
  it("converts correctly with rounding", () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(5.5)).toBe(550);
    // Floating point edge case
    expect(rupeesToPaise(1.005)).toBe(101);
  });
});

// ─── Tax ──────────────────────────────────────────────────────────────────────

describe("calculateTax()", () => {
  it("calculates 5% GST correctly", () => {
    expect(calculateTax(10000, 5)).toBe(500); // ₹100 @ 5% = ₹5
  });

  it("calculates 18% GST correctly", () => {
    expect(calculateTax(10000, 18)).toBe(1800);
  });

  it("returns 0 for zero rate", () => {
    expect(calculateTax(10000, 0)).toBe(0);
  });

  it("returns 0 for negative rate", () => {
    expect(calculateTax(10000, -5)).toBe(0);
  });
});

describe("calculateTotal()", () => {
  it("adds tax to subtotal", () => {
    expect(calculateTotal(10000, 5)).toBe(10500);
    expect(calculateTotal(10000, 18)).toBe(11800);
  });

  it("returns subtotal when tax is zero", () => {
    expect(calculateTotal(10000, 0)).toBe(10000);
  });
});

// ─── Time ─────────────────────────────────────────────────────────────────────

describe("formatElapsed()", () => {
  it("formats seconds to Xm Ys", () => {
    expect(formatElapsed(0)).toBe("0m 00s");
    expect(formatElapsed(65)).toBe("1m 05s");
    expect(formatElapsed(125)).toBe("2m 05s");
    expect(formatElapsed(600)).toBe("10m 00s");
  });
});

describe("formatCountdown()", () => {
  it("formats as MM:SS", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(65)).toBe("1:05");
    expect(formatCountdown(600)).toBe("10:00");
  });
});

// ─── Order Status ─────────────────────────────────────────────────────────────

describe("isOrderPaid()", () => {
  it("returns true only for paid", () => {
    expect(isOrderPaid("paid")).toBe(true);
    expect(isOrderPaid("unpaid")).toBe(false);
    expect(isOrderPaid("refunded")).toBe(false);
  });
});

describe("isOrderServed()", () => {
  it("returns true only for served", () => {
    expect(isOrderServed("served")).toBe(true);
    expect(isOrderServed("preparing")).toBe(false);
  });
});

describe("isOrderActive()", () => {
  it("returns true for active statuses", () => {
    expect(isOrderActive("pending")).toBe(true);
    expect(isOrderActive("confirmed")).toBe(true);
    expect(isOrderActive("preparing")).toBe(true);
    expect(isOrderActive("ready")).toBe(true);
    expect(isOrderActive("served")).toBe(false);
    expect(isOrderActive("cancelled")).toBe(false);
  });
});

describe("getOrderStatusLabel()", () => {
  it("returns human-readable labels", () => {
    expect(getOrderStatusLabel("pending")).toBe("Order Placed");
    expect(getOrderStatusLabel("preparing")).toBe("Cooking");
    expect(getOrderStatusLabel("served")).toBe("Delivered");
    expect(getOrderStatusLabel("unknown_status")).toBe("unknown_status");
  });
});

// ─── Menu Helpers ─────────────────────────────────────────────────────────────

describe("getCategoryEmoji()", () => {
  it("maps known category names to emojis", () => {
    expect(getCategoryEmoji("Coffee & Beverages")).toBe("☕");
    expect(getCategoryEmoji("Burgers")).toBe("🍔");
    expect(getCategoryEmoji("Pasta & Noodles")).toBe("🍝");
    expect(getCategoryEmoji("Desserts")).toBe("🍰");
    expect(getCategoryEmoji("Soups")).toBe("🍲");
  });

  it("returns default emoji for unknown categories", () => {
    expect(getCategoryEmoji("Mystery Food")).toBe("🍴");
  });

  it("is case-insensitive", () => {
    expect(getCategoryEmoji("COFFEE")).toBe("☕");
    expect(getCategoryEmoji("Pizza")).toBe("🍕");
  });
});

describe("getPrepTime()", () => {
  it("returns correct times for known items", () => {
    expect(getPrepTime("Chicken Biryani")).toBe("20 min");
    expect(getPrepTime("Margherita Pizza")).toBe("15 min");
    expect(getPrepTime("Crispy Paneer Burger")).toBe("10 min");
    expect(getPrepTime("Cappuccino")).toBe("5 min");
    expect(getPrepTime("Mango Shake")).toBe("5 min");
    expect(getPrepTime("Paneer Tikka")).toBe("18 min");
  });

  it("returns default for unknown items", () => {
    expect(getPrepTime("Unknown Dish XYZ")).toBe("10 min");
  });
});

describe("getStarRating()", () => {
  it("returns a value between 4.1 and 4.9", () => {
    const rating = getStarRating("some-item-id-123");
    expect(rating).toBeGreaterThanOrEqual(4.1);
    expect(rating).toBeLessThanOrEqual(4.9);
  });

  it("returns consistent values for the same ID", () => {
    expect(getStarRating("test-id")).toBe(getStarRating("test-id"));
  });
});

// ─── String Utilities ─────────────────────────────────────────────────────────

describe("truncate()", () => {
  it("returns string unchanged if within limit", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates with ellipsis when over limit", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
    expect(truncate("ABCDEFGHIJ", 5)).toBe("AB...");
  });
});

describe("generateSlug()", () => {
  it("converts names to slugs", () => {
    expect(generateSlug("The French Roastery")).toBe("the-french-roastery");
    expect(generateSlug("Bean & Brew Café!")).toBe("bean-brew-caf");
    expect(generateSlug("  My  Café  ")).toBe("my-caf");
  });

  it("handles special chars", () => {
    expect(generateSlug("Café@2024")).toBe("caf2024");
  });
});

// ─── Urgency Color ────────────────────────────────────────────────────────────

describe("getUrgencyColor()", () => {
  it("returns green for under 8 min", () => {
    expect(getUrgencyColor(5)).toContain("emerald");
  });

  it("returns amber for 8-14 min", () => {
    expect(getUrgencyColor(10)).toContain("amber");
  });

  it("returns red with animate-pulse for 15+ min", () => {
    const result = getUrgencyColor(20);
    expect(result).toContain("red");
    expect(result).toContain("animate-pulse");
  });
});
