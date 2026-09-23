// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Settlement decision helpers (A2/B1).
 *
 * Winner-takes-all: the unpaid→paid transition is claimed with a conditional
 * UPDATE … WHERE payment_status = 'unpaid'. Only the winner inserts a payments
 * row and credits loyalty. Losers see alreadySettled / conflict and no-op.
 */

export type SettlePlan =
  | { kind: "already_settled" }
  | { kind: "conflict" }
  | { kind: "noop" }
  | { kind: "settle"; insertPayment: boolean; creditLoyalty: boolean };

export function planSettlement(args: {
  currentPaymentStatus: string;
  requestedPaymentStatus: string;
  /** True when the conditional unpaid→paid update actually claimed the row. */
  wonConditionalUpdate: boolean;
  hasCustomerPhone: boolean;
  /** For pure paid path always true; mixed also inserts. */
  paymentMethod?: string;
}): SettlePlan {
  const {
    currentPaymentStatus,
    requestedPaymentStatus,
    wonConditionalUpdate,
    hasCustomerPhone,
  } = args;

  if (requestedPaymentStatus !== "paid") {
    // Refunds / unpaid flips are handled elsewhere (PATCH /api/orders/[id]).
    return { kind: "noop" };
  }

  if (currentPaymentStatus === "paid") {
    return { kind: "already_settled" };
  }

  if (!wonConditionalUpdate) {
    // Lost the race — another request already settled (or row vanished).
    return { kind: "conflict" };
  }

  return { kind: "settle", insertPayment: true, creditLoyalty: hasCustomerPhone };
}

/** Map POS tender → payments.provider (single-tender settle path). */
export function settleProvider(paymentMethod: string): string {
  const p = String(paymentMethod || "").toLowerCase();
  if (p === "upi" || p === "upi_qr" || p === "online") return "upi_qr";
  if (p === "card" || p === "card_pos") return "card_pos";
  return "cash";
}

/** True when a Postgres unique_violation (23505) means "already recorded". */
export function isUniqueViolation(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return err.code === "23505" || /duplicate key value/i.test(err.message || "");
}
