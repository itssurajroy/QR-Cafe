// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import {
  buildPaymentReceivedVars,
  buildRefundProcessedVars,
  buildPaymentReceivedTemplate,
  buildRefundProcessedTemplate,
  renderTemplate,
} from "@/integrations/whatsapp/templates/payment";

describe("payment templates", () => {
  it("renders payment_received with received text", () => {
    const p = renderTemplate("payment_received", { orderNumber: "1045", amount: "₹840" });
    expect(p).toContain("received");
  });

  it("renders refund_processed with refund text", () => {
    const f = renderTemplate("refund_processed", { orderNumber: "1045", refundAmount: "₹200" });
    expect(f).toContain("refund");
  });

  it("builds typed vars with defaults", () => {
    const p = buildPaymentReceivedVars({ orderNumber: "1045", amount: "₹840" });
    expect(p.orderNumber).toBe("1045");
    const f = buildRefundProcessedVars({ orderNumber: "1045", refundAmount: "₹200" });
    expect(f.orderNumber).toBe("1045");
    expect(f.refundAmount).toBe("₹200");
  });

  it("builds WhatsAppTemplate objects without transport calls", () => {
    const p = buildPaymentReceivedTemplate(buildPaymentReceivedVars({ orderNumber: "1045", amount: "₹840" }));
    expect(p.name).toBe("payment_received");
    expect(p.language).toBe("en");
    expect(p.components.length).toBeGreaterThan(0);
    const f = buildRefundProcessedTemplate(buildRefundProcessedVars({ orderNumber: "1045", refundAmount: "₹200" }));
    expect(f.name).toBe("refund_processed");
    expect(f.components.length).toBeGreaterThan(0);
  });
});
