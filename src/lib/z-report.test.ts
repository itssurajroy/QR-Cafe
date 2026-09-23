// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { bucketPayments, dayRange } from "./z-report";

describe("dayRange (B7 tenant timezone)", () => {
  it("covers IST midnight-to-midnight, not UTC", () => {
    // 2026-09-23 18:30 UTC = 2026-09-24 00:00 IST → belongs to Sep 24 IST
    const ref = new Date("2026-09-23T18:30:00.000Z");
    const r = dayRange("Asia/Kolkata", ref);
    expect(r.day).toBe("2026-09-24");
    // IST midnight Sep 24 = Sep 23 18:30 UTC
    expect(r.start).toBe("2026-09-23T18:30:00.000Z");
    expect(r.end).toBe("2026-09-24T18:30:00.000Z");
  });

  it("start is inclusive, end exclusive, end is next local day", () => {
    const ref = new Date("2026-01-15T12:00:00.000Z");
    const r = dayRange("Asia/Kolkata", ref);
    expect(r.day).toBe("2026-01-15");
    expect(new Date(r.end).getTime() - new Date(r.start).getTime()).toBe(24 * 3600 * 1000);
  });

  it("12:00 UTC on Jan 15 is still Jan 15 in IST", () => {
    const r = dayRange("Asia/Kolkata", new Date("2026-01-15T12:00:00.000Z"));
    expect(r.day).toBe("2026-01-15");
    expect(r.start).toBe("2026-01-14T18:30:00.000Z");
  });

  it("falls back to Asia/Kolkata for invalid timezone", () => {
    const r = dayRange("Not/AZone", new Date("2026-01-15T12:00:00.000Z"));
    expect(r.timezone).toBe("Asia/Kolkata");
  });

  it("falls back to Asia/Kolkata for null/empty timezone", () => {
    expect(dayRange(null).timezone).toBe("Asia/Kolkata");
    expect(dayRange("").timezone).toBe("Asia/Kolkata");
    expect(dayRange(undefined).timezone).toBe("Asia/Kolkata");
  });

  it("handles a non-IST zone (America/New_York EST)", () => {
    // 2026-01-15 05:00 UTC = 2026-01-14 00:00 EST (UTC-5)
    const r = dayRange("America/New_York", new Date("2026-01-15T05:00:00.000Z"));
    expect(r.day).toBe("2026-01-15");
    expect(r.start).toBe("2026-01-15T05:00:00.000Z");
  });
});

describe("bucketPayments (A1 tender truth)", () => {
  it("buckets by provider", () => {
    const b = bucketPayments([
      { provider: "cash", amount_paise: 50000, status: "success" },
      { provider: "upi_qr", amount_paise: 30000, status: "success" },
      { provider: "card_pos", amount_paise: 20000, status: "success" },
      { provider: "paypal", amount_paise: 10000, status: "success" },
    ]);
    expect(b).toEqual({
      cash_paise: 50000,
      upi_paise: 30000,
      card_paise: 20000,
      other_paise: 10000,
      total_paise: 110000,
      count: 4,
    });
  });

  it("ignores non-success payments", () => {
    const b = bucketPayments([
      { provider: "cash", amount_paise: 50000, status: "success" },
      { provider: "cash", amount_paise: 99999, status: "failed" },
      { provider: "upi_qr", amount_paise: 1, status: "pending" },
    ]);
    expect(b.total_paise).toBe(50000);
    expect(b.count).toBe(1);
  });

  it("treats legacy rows without status as success", () => {
    const b = bucketPayments([{ provider: "cash", amount_paise: 100 }]);
    expect(b.cash_paise).toBe(100);
    expect(b.count).toBe(1);
  });

  it("ignores zero and negative amounts", () => {
    const b = bucketPayments([
      { provider: "cash", amount_paise: 0, status: "success" },
      { provider: "cash", amount_paise: -100, status: "success" },
      { provider: "cash", amount_paise: 10, status: "success" },
    ]);
    expect(b.total_paise).toBe(10);
    expect(b.count).toBe(1);
  });

  it("cash fallback for provider=counter channel rows is not used — only tender providers", () => {
    // orders.payment_method='counter' never appears here; payments.provider is tender.
    const b = bucketPayments([{ provider: "counter", amount_paise: 100, status: "success" }]);
    expect(b.other_paise).toBe(100);
    expect(b.cash_paise).toBe(0);
  });
});
