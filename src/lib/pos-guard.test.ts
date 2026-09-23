// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { canManageFloor, canSettle, forbidden, unauthorized } from "./pos-guard";

describe("pos-guard helpers", () => {
  it("unauthorized returns 401 JSON", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("forbidden returns 403 JSON with message", async () => {
    const res = forbidden("nope");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "nope" });
  });

  it("canSettle allows owner/manager/super_admin only", () => {
    expect(canSettle({ role: "owner" })).toBe(true);
    expect(canSettle({ role: "manager" })).toBe(true);
    expect(canSettle({ role: "super_admin" })).toBe(true);
    expect(canSettle({ role: "staff" })).toBe(false);
    expect(canSettle({ role: "waiter" })).toBe(false);
    expect(canSettle({ role: "kitchen" })).toBe(false);
  });

  it("canManageFloor excludes kitchen", () => {
    expect(canManageFloor({ role: "owner" })).toBe(true);
    expect(canManageFloor({ role: "staff" })).toBe(true);
    expect(canManageFloor({ role: "waiter" })).toBe(true);
    expect(canManageFloor({ role: "kitchen" })).toBe(false);
  });
});
