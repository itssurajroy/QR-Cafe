// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { formatINR, toWhatsAppJid, buildBillReceiptText } from "@/lib/whatsapp-bill-text";

describe("formatINR", () => {
  it("formatINR groups Indian digits", () => {
    expect(formatINR(33000)).toBe("₹330.00");
    expect(formatINR(123456789)).toBe("₹12,34,567.89");
  });
});

describe("toWhatsAppJid", () => {
  it("toWhatsAppJid normalizes Indian mobiles", () => {
    expect(toWhatsAppJid("9876543210")).toBe("919876543210@s.whatsapp.net");
    expect(toWhatsAppJid("09876543210")).toBe("919876543210@s.whatsapp.net");
    expect(toWhatsAppJid("+91 98765-43210")).toBe("919876543210@s.whatsapp.net");
    expect(toWhatsAppJid("447911123456")).toBe("447911123456@s.whatsapp.net");
    expect(toWhatsAppJid("123")).toBeNull();
    expect(toWhatsAppJid("")).toBeNull();
  });
});

describe("buildBillReceiptText", () => {
  it("buildBillReceiptText renders items, total, paid line, receipt url", () => {
    const text = buildBillReceiptText({
      restaurantName: "Curry Leaf",
      restaurantGstin: "29ABCDE1234F1Z5",
      orderNumber: "ORD-12",
      tableLabel: "T-4",
      items: [
        { name: "Butter Naan", quantity: 2, pricePaise: 4000 },
        { name: "Paneer Tikka", quantity: 1, pricePaise: 25000 },
      ],
      totalPaise: 33000,
      paymentStatus: "paid",
      paymentMethod: "upi_qr",
      receiptUrl: "https://www.qrslice.com/receipt/abc",
    });
    expect(text).toContain("*Curry Leaf*");
    expect(text).toContain("GSTIN: 29ABCDE1234F1Z5");
    expect(text).toContain("2 x Butter Naan");
    expect(text).toContain("*Total: ₹330.00*");
    expect(text).toContain("Paid");
    expect(text).toContain("https://www.qrslice.com/receipt/abc");
  });

  it("buildBillReceiptText omits GSTIN when absent; empty items still valid", () => {
    const text = buildBillReceiptText({
      restaurantName: "X", restaurantGstin: undefined,
      orderNumber: "1", tableLabel: null,
      items: [], totalPaise: 0,
      paymentStatus: "pending", paymentMethod: null,
      receiptUrl: "https://example.test/r",
    });
    expect(text).not.toContain("GSTIN");
    expect(text).toContain("pending");
  });
});
