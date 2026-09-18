// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect, beforeEach } from "vitest";
import {
  buildOrderAgainVars,
  buildOrderAgainLink,
} from "@/lib/whatsapp-templates";
import {
  buildOrderConfirmationVars,
  renderOrderConfirmationText,
} from "@/integrations/whatsapp/templates/order-confirmation";

describe("Order Again deep link", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://qrslice.com";
  });

  it("builds the order-again deep link from a status token", () => {
    const vars = buildOrderAgainVars({ statusToken: "abc123" });
    const link = buildOrderAgainLink(vars);
    expect(link).toBe("https://qrslice.com/order-again/abc123");
  });

  it("includes the order-again link as a text line in the order confirmation", () => {
    const vars = buildOrderConfirmationVars({
      orderNumber: "1045",
      tableLabel: "T05",
      items: [{ name: "Masala Dosa", qty: 2 }],
      totalPaise: 29900,
      statusToken: "abc123",
    });
    const rendered = renderOrderConfirmationText(vars);
    expect(rendered).toContain(
      "https://qrslice.com/order-again/abc123",
    );
  });
});
