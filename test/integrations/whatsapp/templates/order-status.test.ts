// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import {
  buildOrderAcceptedVars,
  buildPreparingVars,
  buildReadyVars,
  buildServedVars,
  buildOrderAcceptedTemplate,
  buildPreparingTemplate,
  buildReadyTemplate,
  buildServedTemplate,
  renderTemplate,
} from "@/integrations/whatsapp/templates/order-status";

describe("order status templates", () => {
  it("renders order_accepted with accepted text", () => {
    const a = renderTemplate("order_accepted", { orderNumber: "1045", tableLabel: "T05" });
    expect(a).toContain("accepted");
  });

  it("renders ready with ready text", () => {
    const r = renderTemplate("ready", { orderNumber: "1045", tableLabel: "T05" });
    expect(r).toContain("ready");
  });

  it("renders preparing and served", () => {
    const p = renderTemplate("preparing", { orderNumber: "1045", tableLabel: "T05" });
    expect(p).toContain("1045");
    const s = renderTemplate("served", { orderNumber: "1045", tableLabel: "T05" });
    expect(s).toContain("1045");
  });

  it("builds typed vars with defaults", () => {
    const vars = buildOrderAcceptedVars({ orderNumber: "1045", tableLabel: "T05" });
    expect(vars.orderNumber).toBe("1045");
    expect(vars.tableLabel).toBe("T05");
    expect(buildPreparingVars({ orderNumber: 1045 }).tableLabel).toBe("Counter");
    expect(buildReadyVars({ orderNumber: "1045", tableLabel: "T05" }).orderNumber).toBe("1045");
    expect(buildServedVars({ orderNumber: "1045", tableLabel: "T05" }).tableLabel).toBe("T05");
  });

  it("builds WhatsAppTemplate objects without transport calls", () => {
    const a = buildOrderAcceptedTemplate(buildOrderAcceptedVars({ orderNumber: "1045", tableLabel: "T05", etaMinutes: 15 }));
    expect(a.name).toBe("order_accepted");
    expect(a.language).toBe("en");
    expect(a.components.length).toBeGreaterThan(0);
    const p = buildPreparingTemplate(buildPreparingVars({ orderNumber: "1045", tableLabel: "T05" }));
    expect(p.name).toBe("preparing");
    const r = buildReadyTemplate(buildReadyVars({ orderNumber: "1045", tableLabel: "T05" }));
    expect(r.name).toBe("ready");
    const s = buildServedTemplate(buildServedVars({ orderNumber: "1045", tableLabel: "T05" }));
    expect(s.name).toBe("served");
  });
});
