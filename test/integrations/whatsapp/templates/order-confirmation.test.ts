// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import {
  buildOrderConfirmationVars,
  renderTemplate,
  buildOrderConfirmedTemplate,
  ORDER_CONFIRMED_TEMPLATE_NAME,
} from "@/integrations/whatsapp/templates/order-confirmation";

describe("order confirmation template", () => {
  it("renders order number and table label", () => {
    const vars = buildOrderConfirmationVars({
      orderNumber: "1045",
      tableLabel: "T05",
      items: [
        { name: "Masala Dosa", qty: 2 },
        { name: "Filter Coffee", qty: 1 },
      ],
    });
    const rendered = renderTemplate("order_confirmed", vars);
    expect(rendered).toContain("Order #1045 confirmed");
    expect(rendered).toContain("Table T05");
  });

  it("builds a WhatsAppTemplate without transport calls", () => {
    const vars = buildOrderConfirmationVars({
      orderNumber: "1045",
      tableLabel: "T05",
      items: [{ name: "Masala Dosa", qty: 2 }],
      totalPaise: 29900,
      etaMinutes: 15,
    });
    const template = buildOrderConfirmedTemplate(vars);
    expect(template.name).toBe(ORDER_CONFIRMED_TEMPLATE_NAME);
    expect(template.language).toBe("en");
    expect(template.components.length).toBeGreaterThan(0);
  });
});
