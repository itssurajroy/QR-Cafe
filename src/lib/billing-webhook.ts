// Copyright (c) 2026 QRslice. All rights reserved.
// Pure helpers for the Razorpay billing webhook — kept side-effect free so the
// yearly/payment-captured paths are unit-testable (see billing-webhook.test.ts).

type Notes = Record<string, unknown> | null | undefined;
type Payload = Record<string, any> | null | undefined;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Notes attached by create-order / checkout to the Razorpay entity. */
export function extractNotes(payload: Payload): Notes {
  return (
    payload?.subscription?.entity?.notes ||
    payload?.payment_link?.entity?.notes ||
    payload?.payment?.entity?.notes ||
    payload?.order?.entity?.notes ||
    null
  );
}

/**
 * Resolve the Razorpay order id across event shapes:
 * - order.paid:        payload.order.entity.id
 * - payment.captured:  payload.payment.entity.order_id (order entity is absent)
 * - explicit note:     notes.razorpay_order_id (if ever set at creation time)
 */
export function resolveRazorpayOrderId(payload: Payload, notes: Notes): string | null {
  return (
    str(notes?.razorpay_order_id) ||
    str(payload?.payment?.entity?.order_id) ||
    str(payload?.order?.entity?.id) ||
    null
  );
}

/**
 * Resolve the billing cycle for subscription extension.
 * create-order writes `billing_cycle`; the legacy checkout payment-link
 * flow writes `cycle`; billing_payments.billing_cycle is the DB fallback.
 */
export function resolveBillingCycle(
  notes: Notes,
  lookupCycle?: string | null,
): "monthly" | "yearly" {
  const cycle = str(notes?.billing_cycle) || str(notes?.cycle) || str(lookupCycle);
  return cycle === "yearly" ? "yearly" : "monthly";
}

export function cycleDurationDays(cycle: "monthly" | "yearly"): number {
  return cycle === "yearly" ? 365 : 30;
}

/**
 * True when webhook notes belong to a subscription payment (Standard Checkout
 * or legacy payment link) rather than a restaurant order payment.
 */
export function isSubscriptionPaymentNotes(notes: Notes): boolean {
  return Boolean(str(notes?.plan_id) || str(notes?.billing_cycle) || str(notes?.cycle));
}
