// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  renderWhatsAppMessage,
  buildWhatsAppReceiptVars,
  DEFAULT_WA_TEMPLATE,
  type TemplateVars,
} from "./whatsapp-templates";
import { normalizeWaPhone, isValidIndianPhone, getWaLink } from "./utils";

describe("WhatsApp Templates & Message Rendering", () => {
  const sampleVars: TemplateVars = {
    restaurant: { name: "Curry Leaf", gstin: "07AAAAA0000A1Z5" },
    orderNumber: "1042",
    tableNumber: "T-4",
    total: "450.00",
    paymentModeLine: "• Paid via UPI",
    receiptUrl: "https://qrslice.com/receipt/abc-123",
  };

  it("renders default template accurately", () => {
    const msg = renderWhatsAppMessage(DEFAULT_WA_TEMPLATE, sampleVars);
    expect(msg).toContain("Thanks for visiting Curry Leaf 🧾");
    expect(msg).toContain("Order #1042 • Table T-4");
    expect(msg).toContain("Total: ₹450.00 • Paid via UPI");
    expect(msg).toContain("https://qrslice.com/receipt/abc-123");
  });

  it("handles null or empty template by defaulting to standard format", () => {
    const msg = renderWhatsAppMessage(null, sampleVars);
    expect(msg).toContain("Thanks for visiting Curry Leaf");
  });

  it("supports preview mode for missing variables", () => {
    const incompleteVars: TemplateVars = {
      restaurant: { name: "Chai Point" },
      orderNumber: "",
      tableNumber: "",
      total: "",
      paymentModeLine: "",
      receiptUrl: "https://qrslice.com/receipt/xyz",
    };

    const previewMsg = renderWhatsAppMessage(DEFAULT_WA_TEMPLATE, incompleteVars, true);
    expect(previewMsg).toContain("[MISSING: orderNumber]");
    expect(previewMsg).toContain("[MISSING: total]");

    const prodMsg = renderWhatsAppMessage(DEFAULT_WA_TEMPLATE, incompleteVars, false);
    expect(prodMsg).not.toContain("[MISSING:");
  });

  it("safely handles unknown tokens in preview mode vs production", () => {
    const customTemplate = "Welcome to {restaurant.name}! Your discount code is {discountCode}.";
    
    const previewMsg = renderWhatsAppMessage(customTemplate, sampleVars, true);
    expect(previewMsg).toContain("[UNKNOWN: discountCode]");

    const prodMsg = renderWhatsAppMessage(customTemplate, sampleVars, false);
    expect(prodMsg).toBe("Welcome to Curry Leaf! Your discount code is .");
  });

  it("builds formatted TemplateVars from raw order values", () => {
    const vars = buildWhatsAppReceiptVars({
      restaurantName: "Biryani House",
      orderNumber: 201,
      tableLabel: "Table 12",
      totalPaise: 125000,
      paymentMethod: "cash",
      receiptUrl: "https://qrslice.com/receipt/tok-999",
    });

    expect(vars.total).toBe("1250.00");
    expect(vars.paymentModeLine).toBe("• Paid via CASH");
    expect(vars.tableNumber).toBe("Table 12");
  });
});

describe("Phone Normalization & Validation", () => {
  it("normalizes standard 10-digit Indian numbers with 91 prefix", () => {
    expect(normalizeWaPhone("9876543210")).toBe("919876543210");
    expect(normalizeWaPhone("+91 98765 43210")).toBe("919876543210");
    expect(normalizeWaPhone("98765-43210")).toBe("919876543210");
  });

  it("normalizes 11-digit numbers starting with 0", () => {
    expect(normalizeWaPhone("09876543210")).toBe("919876543210");
  });

  it("keeps numbers that already have 91 country code", () => {
    expect(normalizeWaPhone("919876543210")).toBe("919876543210");
  });

  it("validates plausible Indian mobile numbers", () => {
    expect(isValidIndianPhone("9876543210")).toBe(true);
    expect(isValidIndianPhone("+919876543210")).toBe(true);
    expect(isValidIndianPhone("09876543210")).toBe(true);

    // Invalid lengths
    expect(isValidIndianPhone("12345")).toBe(false);
    expect(isValidIndianPhone("")).toBe(false);
  });

  it("builds proper wa.me link with encoded text", () => {
    const link = getWaLink("9876543210", "Hello World! ₹500");
    expect(link).toContain("https://wa.me/919876543210?text=Hello%20World!%20%E2%82%B9500");
  });
});
