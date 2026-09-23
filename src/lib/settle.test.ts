// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { isUniqueViolation, planSettlement, settleProvider } from "./settle";

describe("planSettlement (A2/B1)", () => {
  it("returns already_settled when order is already paid (no double insert)", () => {
    const plan = planSettlement({
      currentPaymentStatus: "paid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: false,
      hasCustomerPhone: true,
    });
    expect(plan.kind).toBe("already_settled");
  });

  it("returns already_settled even if conditional update would have won", () => {
    // Route short-circuits before update, but the pure fn must still refuse insert.
    const plan = planSettlement({
      currentPaymentStatus: "paid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: true,
      hasCustomerPhone: false,
    });
    expect(plan.kind).toBe("already_settled");
  });

  it("loser of the race gets conflict — no payment insert", () => {
    const plan = planSettlement({
      currentPaymentStatus: "unpaid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: false,
      hasCustomerPhone: true,
    });
    expect(plan.kind).toBe("conflict");
  });

  it("winner of unpaid→paid settles and inserts payment", () => {
    const plan = planSettlement({
      currentPaymentStatus: "unpaid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: true,
      hasCustomerPhone: false,
    });
    expect(plan).toMatchObject({ kind: "settle", insertPayment: true, creditLoyalty: false });
  });

  it("winner with customer phone also credits loyalty", () => {
    const plan = planSettlement({
      currentPaymentStatus: "unpaid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: true,
      hasCustomerPhone: true,
    });
    expect(plan).toMatchObject({ kind: "settle", creditLoyalty: true });
  });

  it("noop for non-paid requests (refund/unpaid flips)", () => {
    const plan = planSettlement({
      currentPaymentStatus: "paid",
      requestedPaymentStatus: "refunded",
      wonConditionalUpdate: true,
      hasCustomerPhone: true,
    });
    expect(plan.kind).toBe("noop");
  });
});

describe("settleProvider", () => {
  it("maps POS tenders to payments.provider", () => {
    expect(settleProvider("cash")).toBe("cash");
    expect(settleProvider("upi")).toBe("upi_qr");
    expect(settleProvider("card")).toBe("card_pos");
    expect(settleProvider("online")).toBe("upi_qr");
    expect(settleProvider("")).toBe("cash");
  });
});

describe("isUniqueViolation", () => {
  it("detects 23505", () => {
    expect(isUniqueViolation({ code: "23505", message: "x" })).toBe(true);
    expect(isUniqueViolation({ message: 'duplicate key value violates unique constraint' })).toBe(true);
    expect(isUniqueViolation({ code: "23503", message: "fk" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
