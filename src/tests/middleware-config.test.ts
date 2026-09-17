// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { isPublicPath, isApiRoute } from "@/lib/middleware/config";

describe("Middleware Config & Public Routes", () => {
  it("allows public page routes without authentication", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/onboarding")).toBe(true);
    expect(isPublicPath("/onboarding/")).toBe(true);
    expect(isPublicPath("/pricing")).toBe(true);
    expect(isPublicPath("/about")).toBe(true);
  });

  it("allows public onboarding and auth APIs without session", () => {
    expect(isPublicPath("/api/onboarding")).toBe(true);
    expect(isPublicPath("/api/auth/login")).toBe(true);
    expect(isPublicPath("/api/auth/pin")).toBe(true);
    expect(isPublicPath("/api/auth/logout")).toBe(true);
    expect(isPublicPath("/api/billing/webhook")).toBe(true);
    expect(isPublicPath("/api/feedback")).toBe(true);
    expect(isPublicPath("/api/contact")).toBe(true);
  });

  it("allows guest storefront APIs and assets without authentication", () => {
    expect(isPublicPath("/api/public/resolve-table")).toBe(true);
    expect(isPublicPath("/api/public/customer-balance")).toBe(true);
    expect(isPublicPath("/api/whatsapp/log-event")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
    expect(isPublicPath("/logo.png")).toBe(true);
    expect(isPublicPath("/favicon.png")).toBe(true);
    expect(isPublicPath("/og-image.png")).toBe(true);
  });

  it("protects authenticated admin and pos paths", () => {
    expect(isPublicPath("/admin")).toBe(false);
    expect(isPublicPath("/pos")).toBe(false);
    expect(isPublicPath("/api/admin/crud")).toBe(false);
    expect(isPublicPath("/super")).toBe(false);
    expect(isPublicPath("/api/super/tenants")).toBe(false);
  });

  it("correctly identifies API routes", () => {
    expect(isApiRoute("/api/onboarding")).toBe(true);
    expect(isApiRoute("/onboarding")).toBe(false);
  });
});
