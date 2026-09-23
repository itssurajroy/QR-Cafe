// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/invoice.service", () => ({
  InvoiceService: {
    generateInvoice: vi.fn(async () => ({
      pdfBuffer: Buffer.from("%PDF-1.4 fake"),
      invoiceData: {
        restaurant: {
          name: "Curry Leaf",
          address: "1 Main St",
          phone: "9999999999",
          gstin: "29AAAAA0000A1Z5",
          currency: "INR",
        },
        order: {
          id: "323e4567-e89b-42d3-a456-426614174000",
          order_number: "1042",
          table_label: "T1",
          created_at: new Date().toISOString(),
          subtotal_paise: 100000,
          discount_paise: 0,
          tax_paise: 5000,
          tax_rate: 5,
          total_paise: 105000,
          payment_status: "paid",
          payment_method: "cash",
          customer_name: null,
          customer_phone: null,
        },
        items: [],
        tax: {
          taxable_value_paise: 100000,
          tax_rate: 5,
          cgst_paise: 2500,
          sgst_paise: 2500,
          total_tax_paise: 5000,
        },
      },
    })),
  },
}));

vi.mock("resend", () => {
  class Resend {
    emails = {
      send: vi.fn(async () => ({ error: null })),
    };
    constructor(_apiKey?: string) {}
  }
  return { Resend };
});

import { sendInvoiceEmail } from "./invoice-email";

describe("sendInvoiceEmail", () => {
  const prevKey = process.env.RESEND_API_KEY;
  const prevFrom = process.env.EMAIL_FROM;

  it("skips when provider env is unconfigured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    const r = await sendInvoiceEmail({
      orderId: "323e4567-e89b-42d3-a456-426614174000",
      to: "guest@example.com",
    });
    expect(r.sent).toBe(false);
    expect(r.skipped).toBe("email-provider-unconfigured");
  });

  it("rejects invalid email without calling provider", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "billing@qrslice.test";
    const r = await sendInvoiceEmail({
      orderId: "323e4567-e89b-42d3-a456-426614174000",
      to: "not-an-email",
    });
    expect(r.sent).toBe(false);
    expect(r.skipped).toBe("invalid-email");
  });

  it("sends when configured and email is valid", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "billing@qrslice.test";
    const r = await sendInvoiceEmail({
      orderId: "323e4567-e89b-42d3-a456-426614174000",
      to: "guest@example.com",
    });
    expect(r.sent).toBe(true);
    expect(r.to).toBe("guest@example.com");
  });

  it("restores env", () => {
    if (prevKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevKey;
    if (prevFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = prevFrom;
  });
});
