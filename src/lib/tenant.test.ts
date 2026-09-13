// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { planToSubscriptionStatus } from "./subscription";

describe("planToSubscriptionStatus", () => {
  it("maps active/suspended/cancelled directly", () => {
    expect(planToSubscriptionStatus("active", null)).toBe("active");
    expect(planToSubscriptionStatus("suspended", null)).toBe("suspended");
    expect(planToSubscriptionStatus("cancelled", null)).toBe("cancelled");
  });
  it("maps trial by expiry", () => {
    const future = new Date(Date.now() + 864e5).toISOString();
    const past = new Date(Date.now() - 864e5).toISOString();
    expect(planToSubscriptionStatus("trial", future)).toBe("trial");
    expect(planToSubscriptionStatus("trial", past)).toBe("expired");
    expect(planToSubscriptionStatus("trial", null)).toBe("trial");
  });
  it("falls back to expired for unknown", () => {
    expect(planToSubscriptionStatus("weird", null)).toBe("expired");
  });
});

