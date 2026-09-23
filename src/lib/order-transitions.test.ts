// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  authorizeStatusChange,
  canSettleComplete,
  canTransition,
  canTransitionPayment,
} from "./order-transitions";

describe("canTransition (B4)", () => {
  it("allows the live kitchen path", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "preparing")).toBe(true);
    expect(canTransition("preparing", "ready")).toBe(true);
    expect(canTransition("ready", "served")).toBe(true);
    expect(canTransition("served", "completed")).toBe(true);
    expect(canTransition("ready", "completed")).toBe(true);
  });

  it("rejects skipping and reopening terminals", () => {
    expect(canTransition("pending", "completed")).toBe(false);
    expect(canTransition("pending", "served")).toBe(false);
    expect(canTransition("completed", "preparing")).toBe(false);
    expect(canTransition("cancelled", "preparing")).toBe(false);
    expect(canTransition("rejected", "pending")).toBe(false);
  });

  it("allows cancel from active states only", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("preparing", "cancelled")).toBe(true);
    expect(canTransition("completed", "cancelled")).toBe(false);
  });
});

describe("canTransitionPayment", () => {
  it("allows unpaid→paid and paid→refunded", () => {
    expect(canTransitionPayment("unpaid", "paid")).toBe(true);
    expect(canTransitionPayment("paid", "refunded")).toBe(true);
    expect(canTransitionPayment("refunded", "unpaid")).toBe(true);
  });

  it("rejects invalid payment moves", () => {
    expect(canTransitionPayment("paid", "pending")).toBe(false);
    expect(canTransitionPayment("refunded", "paid")).toBe(false);
  });
});

describe("canSettleComplete", () => {
  it("allows force-complete on active statuses", () => {
    expect(canSettleComplete("pending")).toBe(true);
    expect(canSettleComplete("preparing")).toBe(true);
    expect(canSettleComplete("served")).toBe(true);
  });

  it("blocks terminals", () => {
    expect(canSettleComplete("completed")).toBe(false);
    expect(canSettleComplete("cancelled")).toBe(false);
    expect(canSettleComplete("rejected")).toBe(false);
  });
});

describe("authorizeStatusChange", () => {
  it("lets kitchen advance but not cancel", () => {
    expect(authorizeStatusChange("kitchen", "ready").ok).toBe(true);
    expect(authorizeStatusChange("kitchen", "cancelled").ok).toBe(false);
    expect(authorizeStatusChange("kitchen", "rejected").ok).toBe(false);
  });

  it("lets waiter advance but not cancel", () => {
    expect(authorizeStatusChange("waiter", "served").ok).toBe(true);
    expect(authorizeStatusChange("waiter", "cancelled").ok).toBe(false);
  });

  it("lets owner cancel", () => {
    expect(authorizeStatusChange("owner", "cancelled").ok).toBe(true);
    expect(authorizeStatusChange("manager", "rejected").ok).toBe(true);
    expect(authorizeStatusChange("super_admin", "cancelled").ok).toBe(true);
  });

  it("blocks unknown roles", () => {
    expect(authorizeStatusChange("guest", "ready").ok).toBe(false);
  });
});
