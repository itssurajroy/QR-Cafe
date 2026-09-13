// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";

const ALLOWED: Record<string, string[]> = {
  trial: ["active", "expired", "suspended", "cancelled"],
  active: ["suspended", "cancelled", "expired"],
  suspended: ["active", "cancelled"],
  expired: ["active", "cancelled"],
  cancelled: [],
};
export function canTransition(from: string, to: string) {
  return (ALLOWED[from] ?? []).includes(to);
}

describe("subscription machine", () => {
  it("trial can activate", () => { expect(canTransition("trial", "active")).toBe(true); });
  it("cancelled is terminal", () => { expect(canTransition("cancelled", "active")).toBe(false); });
  it("suspended can reactivate", () => { expect(canTransition("suspended", "active")).toBe(true); });
});
