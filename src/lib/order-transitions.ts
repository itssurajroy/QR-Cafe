// Copyright (c) 2026 QRslice. All rights reserved.

/** Canonical order status / payment_status transition tables (B4). */
export const TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["confirmed", "preparing", "rejected", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "completed", "cancelled"],
  served: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

export const PAYMENT_TRANSITIONS: Record<string, readonly string[]> = {
  unpaid: ["paid", "refunded"],
  paid: ["refunded", "unpaid"],
  refunded: ["unpaid"],
};

const TERMINAL = new Set(["completed", "rejected", "cancelled"]);

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function canTransitionPayment(from: string, to: string): boolean {
  return (PAYMENT_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * POS cash/UPI settle may force-complete a still-active order when payment
 * lands (counter sale: paid = done). Terminal statuses stay immutable.
 */
export function canSettleComplete(from: string): boolean {
  return !TERMINAL.has(from) && from !== "completed";
}

export type StatusGate =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Role gate for kitchen-facing status moves.
 * `cancel` / `revoke`-class terminal downs are owner/manager/super_admin only.
 */
export function authorizeStatusChange(
  role: string,
  to: string,
): StatusGate {
  const privilegedCancel =
    role === "owner" || role === "manager" || role === "super_admin";
  const orderRoles = new Set([
    "owner",
    "manager",
    "super_admin",
    "staff",
    "waiter",
    "kitchen",
  ]);
  if (!orderRoles.has(role)) {
    return { ok: false, error: "Forbidden: order status change not allowed" };
  }
  if ((to === "cancelled" || to === "rejected") && !privilegedCancel) {
    return {
      ok: false,
      error: "Forbidden: only manager or owner can cancel/reject orders",
    };
  }
  return { ok: true };
}
