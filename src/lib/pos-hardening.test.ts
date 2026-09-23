// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  calculateAuthoritativePricing,
  calculateItemLineTotal,
  calculateItemUnitPrice,
} from "@/lib/pricing";
import {
  isValidGstin,
  normalizeGstin,
  orderStatusEnum,
  patchOrderSchema,
  validateSplitTender,
} from "@/lib/validation";
import { isUniqueViolation, planSettlement, settleProvider } from "@/lib/settle";
import {
  POS_FLOOR_ROLES,
  POS_ORDER_ROLES,
  POS_SETTLE_ROLES,
  canManageFloor,
  canSettle,
} from "@/lib/pos-guard";
import { bucketPayments, dayRange } from "@/lib/z-report";
import { ensureIdempotencyKey } from "@/lib/offline-queue";
import { authorizeStatusChange, canSettleComplete, canTransition } from "@/lib/order-transitions";

describe("POS hardening — pricing never trusts client deltas (A3/A6)", () => {
  it("clamps negative portion_delta and modifier deltas", () => {
    const unit = calculateItemUnitPrice(10000, -5000, [
      { option_name: "x", price_delta_paise: -200 },
      { option_name: "y", price_delta_paise: 100, quantity: 2 },
    ]);
    expect(unit).toBe(10200);
  });

  it("line total floors quantity at 1", () => {
    expect(calculateItemLineTotal(500, 0)).toBe(500);
    expect(calculateItemLineTotal(500, -3)).toBe(500);
    expect(calculateItemLineTotal(500, 3)).toBe(1500);
  });

  it("authoritative pricing: fractional discount rounds, clamp to subtotal", () => {
    const items = [{ menu_item_id: "m", base_price_paise: 9999, quantity: 1 }];
    const r = calculateAuthoritativePricing({
      items,
      discount_paise: 1.4,
      tax_rate_percent: 5,
    });
    expect(r.discount_paise).toBe(1);
    expect(r.net_subtotal_paise).toBe(9998);

    const over = calculateAuthoritativePricing({
      items,
      discount_paise: 999999,
    });
    expect(over.discount_paise).toBe(9999);
    expect(over.net_subtotal_paise).toBe(0);
    expect(over.total_paise).toBe(0);
  });

  it("loyalty cap 25% of subtotal; 1 point = 100 paise", () => {
    const r = calculateAuthoritativePricing({
      items: [{ menu_item_id: "m", base_price_paise: 10000, quantity: 1 }],
      loyalty_points_to_redeem: 1000,
    });
    expect(r.discount_paise).toBe(2500);
    expect(r.net_subtotal_paise).toBe(7500);
  });
});

describe("POS hardening — settlement winner-takes-all (A2/B1)", () => {
  it("noop when not requesting paid", () => {
    expect(
      planSettlement({
        currentPaymentStatus: "unpaid",
        requestedPaymentStatus: "unpaid",
        wonConditionalUpdate: true,
        hasCustomerPhone: false,
      }),
    ).toEqual({ kind: "noop" });
  });

  it("already_settled when paid", () => {
    expect(
      planSettlement({
        currentPaymentStatus: "paid",
        requestedPaymentStatus: "paid",
        wonConditionalUpdate: false,
        hasCustomerPhone: true,
      }),
    ).toEqual({ kind: "already_settled" });
  });

  it("conflict when lost conditional update", () => {
    expect(
      planSettlement({
        currentPaymentStatus: "unpaid",
        requestedPaymentStatus: "paid",
        wonConditionalUpdate: false,
        hasCustomerPhone: false,
      }),
    ).toEqual({ kind: "conflict" });
  });

  it("settle winner: insert payment, credit loyalty only with phone", () => {
    const noPhone = planSettlement({
      currentPaymentStatus: "unpaid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: true,
      hasCustomerPhone: false,
    });
    expect(noPhone).toEqual({
      kind: "settle",
      insertPayment: true,
      creditLoyalty: false,
    });

    const withPhone = planSettlement({
      currentPaymentStatus: "unpaid",
      requestedPaymentStatus: "paid",
      wonConditionalUpdate: true,
      hasCustomerPhone: true,
    });
    expect(withPhone).toMatchObject({ kind: "settle", creditLoyalty: true });
  });

  it("settleProvider maps tender to payments.provider", () => {
    expect(settleProvider("upi")).toBe("upi_qr");
    expect(settleProvider("upi_qr")).toBe("upi_qr");
    expect(settleProvider("online")).toBe("upi_qr");
    expect(settleProvider("card")).toBe("card_pos");
    expect(settleProvider("card_pos")).toBe("card_pos");
    expect(settleProvider("cash")).toBe("cash");
    expect(settleProvider("")).toBe("cash");
    expect(settleProvider("weird")).toBe("cash");
  });

  it("isUniqueViolation detects 23505 and message fallback", () => {
    expect(isUniqueViolation({ code: "23505", message: "x" })).toBe(true);
    expect(isUniqueViolation({ message: "duplicate key value violates unique" })).toBe(
      true,
    );
    expect(isUniqueViolation({ code: "23503", message: "fk" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe("POS hardening — role gates (Phase 5)", () => {
  it("settle roles exclude staff/waiter/kitchen", () => {
    expect([...POS_SETTLE_ROLES]).toEqual(["owner", "manager", "super_admin"]);
    expect(canSettle({ role: "staff" })).toBe(false);
    expect(canSettle({ role: "waiter" })).toBe(false);
    expect(canSettle({ role: "kitchen" })).toBe(false);
    expect(canSettle({ role: "owner" })).toBe(true);
    expect(canSettle({ role: "manager" })).toBe(true);
    expect(canSettle({ role: "super_admin" })).toBe(true);
  });

  it("floor roles include staff+waiter but not kitchen", () => {
    expect(POS_FLOOR_ROLES as readonly string[]).toContain("staff");
    expect(POS_FLOOR_ROLES as readonly string[]).toContain("waiter");
    expect(POS_FLOOR_ROLES as readonly string[]).not.toContain("kitchen");
    expect(canManageFloor({ role: "kitchen" })).toBe(false);
    expect(canManageFloor({ role: "waiter" })).toBe(true);
  });

  it("order roles include kitchen; settle ⊆ floor ⊆ order", () => {
    expect(POS_ORDER_ROLES as readonly string[]).toContain("kitchen");
    for (const r of POS_SETTLE_ROLES) {
      expect(POS_FLOOR_ROLES as readonly string[]).toContain(r);
      expect(POS_ORDER_ROLES as readonly string[]).toContain(r);
    }
    for (const r of POS_FLOOR_ROLES) {
      expect(POS_ORDER_ROLES as readonly string[]).toContain(r);
    }
  });
});

describe("POS hardening — Z-report day + tender truth (A1/B7)", () => {
  it("dayRange is tenant timezone inclusive/exclusive 24h", () => {
    const r = dayRange("Asia/Kolkata", new Date("2026-09-23T18:30:00.000Z"));
    expect(r.day).toBe("2026-09-24");
    expect(new Date(r.end).getTime() - new Date(r.start).getTime()).toBe(86400000);
  });

  it("bucketPayments sums success only, unknown provider → other", () => {
    const b = bucketPayments([
      { provider: "cash", amount_paise: 100, status: "success" },
      { provider: "cash", amount_paise: 999, status: "failed" },
      { provider: "paypal", amount_paise: 50, status: "success" },
    ]);
    expect(b).toMatchObject({
      cash_paise: 100,
      other_paise: 50,
      total_paise: 150,
      count: 2,
    });
  });
});

describe("POS hardening — offline queue idempotency (A18)", () => {
  it("keeps existing uuid idempotency key stable", () => {
    const id = "3f6f0e0a-1111-4222-8333-444455556666";
    const { payload, idempotencyKey } = ensureIdempotencyKey({
      idempotency_key: id,
      items: [],
    });
    expect(idempotencyKey).toBe(id);
    expect(payload).toEqual({ idempotency_key: id, items: [] });
  });

  it("injects uuid when missing or non-uuid", () => {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const missing = ensureIdempotencyKey({ items: [1] });
    expect(missing.idempotencyKey).toMatch(uuidRe);
    expect((missing.payload as { idempotency_key: string }).idempotency_key).toBe(
      missing.idempotencyKey,
    );

    const junk = ensureIdempotencyKey({ idempotency_key: "not-a-uuid" });
    expect(junk.idempotencyKey).toMatch(uuidRe);
    expect(junk.idempotencyKey).not.toBe("not-a-uuid");
  });
});

describe("POS hardening — GSTIN + split tender + patch schema (A5/A15)", () => {
  it("validates and normalizes GSTIN", () => {
    expect(normalizeGstin(" 27aabcd1234a1z5 ")).toBe("27AABCD1234A1Z5");
    expect(isValidGstin("27AABCD1234A1Z5")).toBe(true);
    expect(isValidGstin("27AABCD1234A1Z")).toBe(false);
    expect(isValidGstin("")).toBe(false);
    expect(isValidGstin("abcdefghijklmno")).toBe(false);
  });

  it("split tender must equal total exactly in integer paise", () => {
    expect(validateSplitTender(10000, 5000, 5000)).toEqual({ ok: true });
    expect(validateSplitTender(10000, 10000, 0)).toEqual({ ok: true });
    expect(validateSplitTender(10000, 0, 10000)).toEqual({ ok: true });
    expect(validateSplitTender(10000, 0, 0).ok).toBe(false);
    expect(validateSplitTender(10000, 6000, 3999).ok).toBe(false);
    expect(validateSplitTender(10000, -1, 10001).ok).toBe(false);
    expect(validateSplitTender(10000.5, 10000, 0).ok).toBe(false);
    expect(validateSplitTender(0, 0, 0).ok).toBe(false);
  });

  it("order status enum includes completed (live DB)", () => {
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
    expect(orderStatusEnum.safeParse("settled").success).toBe(false);
  });

  it("patchOrderSchema accepts priority boolean", () => {
    expect(patchOrderSchema.safeParse({ priority: true }).success).toBe(true);
    expect(patchOrderSchema.safeParse({ priority: "yes" }).success).toBe(false);
    expect(
      patchOrderSchema.safeParse({ payment_status: "paid", priority: false }).success,
    ).toBe(true);
  });
});

describe("POS hardening — status transitions (B4)", () => {
  it("completed is terminal; ready can complete", () => {
    expect(canTransition("ready", "completed")).toBe(true);
    expect(canTransition("served", "completed")).toBe(true);
    expect(canTransition("completed", "pending")).toBe(false);
    expect(canTransition("cancelled", "served")).toBe(false);
    expect(canSettleComplete("ready")).toBe(true);
    expect(canSettleComplete("completed")).toBe(false);
    expect(canSettleComplete("cancelled")).toBe(false);
  });

  it("kitchen can advance but not cancel; unknown role forbidden", () => {
    expect(authorizeStatusChange("kitchen", "ready").ok).toBe(true);
    expect(authorizeStatusChange("staff", "preparing").ok).toBe(true);
    expect(authorizeStatusChange("staff", "cancelled").ok).toBe(false);
    expect(authorizeStatusChange("owner", "cancelled").ok).toBe(true);
    expect(authorizeStatusChange("anonymous", "confirmed").ok).toBe(false);
  });
});
