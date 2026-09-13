// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { tenantsToCsv } from "./platform-csv";

describe("tenantsToCsv", () => {
  it("escapes quotes in names", () => {
    const csv = tenantsToCsv([{ id: "1", name: 'Café "Central"', slug: "central", plan: "active", tier: "pro", tax_rate: 5, created_at: "2026-01-01", subscription_ends_at: null, trial_ends_at: null }]);
    expect(csv).toContain('"Café ""Central"""');
    expect(csv.split("\n")[0]).toBe("ID,Name,Slug,Plan,Tier,Tax Rate (%),Created At,Subscription Ends");
  });
});
