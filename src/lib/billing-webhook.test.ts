// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  cycleDurationDays,
  extractNotes,
  isSubscriptionPaymentNotes,
  resolveBillingCycle,
  resolveRazorpayOrderId,
} from "./billing-webhook";

describe("resolveBillingCycle", () => {
  it("returns yearly from create-order notes (billing_cycle)", () => {
    expect(resolveBillingCycle({ billing_cycle: "yearly" })).toBe("yearly");
  });

  it("returns yearly from legacy checkout payment-link notes (cycle)", () => {
    expect(resolveBillingCycle({ cycle: "yearly" })).toBe("yearly");
  });

  it("falls back to the billing_payments lookup cycle", () => {
    expect(resolveBillingCycle(null, "yearly")).toBe("yearly");
  });

  it("defaults to monthly for missing or unknown values", () => {
    expect(resolveBillingCycle(null)).toBe("monthly");
    expect(resolveBillingCycle({ billing_cycle: "weekly" })).toBe("monthly");
  });
});

describe("resolveRazorpayOrderId", () => {
  it("uses payment.entity.order_id on payment.captured (order entity absent)", () => {
    const payload = { payment: { entity: { id: "pay_1", order_id: "order_1" } } };
    expect(resolveRazorpayOrderId(payload, null)).toBe("order_1");
  });

  it("uses order.entity.id on order.paid", () => {
    const payload = { order: { entity: { id: "order_2" } } };
    expect(resolveRazorpayOrderId(payload, null)).toBe("order_2");
  });

  it("prefers an explicit razorpay_order_id note when present", () => {
    const payload = { payment: { entity: { order_id: "order_a" } } };
    expect(resolveRazorpayOrderId(payload, { razorpay_order_id: "order_b" })).toBe("order_b");
  });

  it("returns null when nothing matches", () => {
    expect(resolveRazorpayOrderId({ payment: { entity: { id: "pay_x" } } }, null)).toBeNull();
  });
});

describe("cycleDurationDays", () => {
  it("grants 365 days for yearly and 30 for monthly", () => {
    expect(cycleDurationDays("yearly")).toBe(365);
    expect(cycleDurationDays("monthly")).toBe(30);
  });
});

describe("isSubscriptionPaymentNotes", () => {
  it("detects Standard Checkout subscription notes", () => {
    expect(isSubscriptionPaymentNotes({ plan_id: "abc", billing_cycle: "monthly" })).toBe(true);
  });

  it("detects legacy payment-link notes", () => {
    expect(isSubscriptionPaymentNotes({ cycle: "yearly" })).toBe(true);
  });

  it("does not treat plain order notes as subscription", () => {
    expect(isSubscriptionPaymentNotes({ restaurant_id: "r1", table: "T4" })).toBe(false);
    expect(isSubscriptionPaymentNotes(null)).toBe(false);
  });
});

describe("extractNotes", () => {
  it("reads notes from payment entity on payment events", () => {
    const payload = { payment: { entity: { notes: { plan_id: "p" } } } };
    expect(extractNotes(payload)).toEqual({ plan_id: "p" });
  });

  it("reads notes from payment_link entity", () => {
    const payload = { payment_link: { entity: { notes: { cycle: "yearly" } } } };
    expect(extractNotes(payload)).toEqual({ cycle: "yearly" });
  });

  it("returns null when no entity carries notes", () => {
    expect(extractNotes({ payment: { entity: { id: "pay_1" } } })).toBeNull();
  });
});
