// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  isValidGstin,
  normalizeGstin,
  orderStatusEnum,
  validateSplitTender,
} from "./validation";

describe("validateSplitTender (A5)", () => {
  it("accepts exact cash+upi split", () => {
    expect(validateSplitTender(100000, 60000, 40000)).toEqual({ ok: true });
  });

  it("accepts single-sided split covering full total", () => {
    expect(validateSplitTender(50000, 50000, 0)).toEqual({ ok: true });
    expect(validateSplitTender(50000, 0, 50000)).toEqual({ ok: true });
  });

  it("rejects short payment", () => {
    const r = validateSplitTender(100000, 60000, 30000);
    expect(r.ok).toBe(false);
  });

  it("rejects over payment", () => {
    const r = validateSplitTender(100000, 60000, 50000);
    expect(r.ok).toBe(false);
  });

  it("rejects fractional paise", () => {
    expect(validateSplitTender(100000, 50000.5, 49999.5).ok).toBe(false);
    expect(validateSplitTender(100.5, 50, 50).ok).toBe(false);
  });

  it("rejects negative amounts", () => {
    expect(validateSplitTender(100000, -1, 100001).ok).toBe(false);
    expect(validateSplitTender(100000, 100001, -1).ok).toBe(false);
  });

  it("rejects both sides zero", () => {
    expect(validateSplitTender(100000, 0, 0).ok).toBe(false);
  });

  it("rejects non-positive total", () => {
    expect(validateSplitTender(0, 0, 0).ok).toBe(false);
    expect(validateSplitTender(-100, -50, -50).ok).toBe(false);
  });
});

describe("GSTIN helpers (A15)", () => {
  it("accepts a well-formed GSTIN", () => {
    expect(isValidGstin("27AAPFU0939F1ZV")).toBe(true);
  });

  it("normalizes case and whitespace", () => {
    expect(normalizeGstin(" 27aapfu0939f1zv ")).toBe("27AAPFU0939F1ZV");
    expect(isValidGstin(" 27aapfu0939f1zv ")).toBe(true);
  });

  it("rejects malformed GSTINs", () => {
    expect(isValidGstin("")).toBe(false);
    expect(isValidGstin("27AAPFU0939F1Z")).toBe(false); // 14 chars
    expect(isValidGstin("27AAPFU0939F1ZVX")).toBe(false); // 16 chars
    expect(isValidGstin("XXAAPFU0939F1ZV")).toBe(false); // bad state code (non-digit)
    expect(isValidGstin("27AAAFU0939FZV")).toBe(false); // 14 chars (missing entity digit)
    expect(isValidGstin("not-a-gstin!")).toBe(false);
  });
});

describe("orderStatusEnum includes completed (B4)", () => {
  it("parses every live status including completed", () => {
    for (const s of [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "completed",
      "cancelled",
      "rejected",
    ]) {
      expect(orderStatusEnum.safeParse(s).success).toBe(true);
    }
  });

  it("rejects unknown status", () => {
    expect(orderStatusEnum.safeParse("closed").success).toBe(false);
  });
});
