// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { requirePermission } from "./platform-auth";

describe("requirePermission", () => {
  it("super_admin passes everything", () => {
    expect(requirePermission({ role: "super_admin", permissions: {} } as any, "tenants.write")).toBe(true);
  });
  it("support needs explicit grant", () => {
    expect(requirePermission({ role: "support", permissions: { "tenants.write": true } } as any, "tenants.write")).toBe(true);
    expect(requirePermission({ role: "support", permissions: {} } as any, "tenants.write")).toBe(false);
  });
  it("null user fails closed", () => {
    expect(requirePermission(null, "tenants.write")).toBe(false);
  });
});
