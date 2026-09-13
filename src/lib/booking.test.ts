// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { overlaps, pickTables, genBookingCode, withinHours, istDayKey, isSameDayIST, isGraceExpired, suggestNextSlot } from "./booking";

describe("overlaps (15-min buffer, check-only)", () => {
  it("flags touching slots as overlapping because of buffer", () => {
    const aS = new Date("2026-09-10T12:00:00");
    const aE = new Date("2026-09-10T13:30:00");
    const bS = new Date("2026-09-10T13:30:00");
    const bE = new Date("2026-09-10T15:00:00");
    expect(overlaps(aS, aE, bS, bE, 15)).toBe(true);
  });
  it("passes slots 20 min apart", () => {
    const aS = new Date("2026-09-10T12:00:00");
    const aE = new Date("2026-09-10T13:30:00");
    const bS = new Date("2026-09-10T13:50:00");
    const bE = new Date("2026-09-10T15:00:00");
    expect(overlaps(aS, aE, bS, bE, 15)).toBe(false);
  });
});

describe("pickTables (smallest fit, unlimited combine)", () => {
  const tables = [
    { id: "t2", seats: 2 },
    { id: "t4", seats: 4 },
    { id: "t6", seats: 6 },
  ];
  it("picks smallest single fitting table", () => {
    expect(pickTables(tables, 3)).toEqual(["t4"]);
  });
  it("combines smallest-first when no single fits", () => {
    expect(pickTables(tables, 8)).toEqual(["t2", "t4", "t6"]);
  });
  it("returns null when seats insufficient", () => {
    expect(pickTables(tables, 99)).toBeNull();
  });
});

describe("genBookingCode", () => {
  it("returns 6 unambiguous chars", () => {
    expect(genBookingCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
});

describe("withinHours", () => {
  it("accepts inside hours, rejects outside", () => {
    const s = new Date("2026-09-10T13:00:00+05:30");
    const e = new Date("2026-09-10T14:30:00+05:30");
    expect(withinHours(s, e, "11:00", "23:00")).toBe(true);
    expect(withinHours(s, e, "14:00", "23:00")).toBe(false);
  });
  it("uses IST wall-clock, not server-local time (UTC regression)", () => {
    const s = new Date("2026-09-10T07:30:00Z"); // 13:00 IST
    const e = new Date("2026-09-10T09:00:00Z"); // 14:30 IST
    expect(withinHours(s, e, "11:00", "23:00")).toBe(true);
  });
});

describe("istDayKey / isSameDayIST", () => {
  it("keys IST midnight correctly", () => {
    expect(istDayKey(new Date("2026-09-10T00:30:00+05:30"))).toBe("2026-09-10");
  });
  it("same IST day true, across midnight false", () => {
    expect(isSameDayIST(new Date("2026-09-10T00:30:00+05:30"), new Date("2026-09-10T23:00:00+05:30"))).toBe(true);
    expect(isSameDayIST(new Date("2026-09-10T23:30:00+05:30"), new Date("2026-09-11T00:30:00+05:30"))).toBe(false);
  });
});

describe("isGraceExpired", () => {
  it("expires after grace, not before", () => {
    const ends = new Date("2026-09-10T12:00:00+05:30");
    expect(isGraceExpired(ends, new Date(ends.getTime() + 31 * 60000), 30)).toBe(true);
    expect(isGraceExpired(ends, new Date(ends.getTime() + 29 * 60000), 30)).toBe(false);
  });
});

describe("suggestNextSlot", () => {
  it("returns +30min when free, null when fully busy", () => {
    const starts = new Date("2026-09-10T12:00:00+05:30");
    const busy = [{ starts_at: starts.toISOString(), ends_at: new Date(starts.getTime() + 10 * 60000).toISOString() }];
    const next = suggestNextSlot(starts, 30, busy);
    expect(next?.toISOString()).toBe(new Date(starts.getTime() + 30 * 60000).toISOString());
    const wall = [{ starts_at: new Date(starts.getTime() - 15 * 60000).toISOString(), ends_at: new Date(starts.getTime() + (6 * 30 + 30 + 15) * 60000).toISOString() }];
    expect(suggestNextSlot(starts, 30, wall)).toBeNull();
  });
});

