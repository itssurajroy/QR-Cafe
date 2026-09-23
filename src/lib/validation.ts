// Copyright (c) 2026 QRslice. All rights reserved.
import { z } from "zod";

// Trim and sanitize strings to prevent malicious inputs
const sanitizedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((val) => val.replace(/[<>]/g, ""));

export const modifierSchema = z.object({
  option_name: sanitizedString(120),
  price_delta_paise: z.number().int().min(0).max(10_000_00), // Max delta ₹10,000
});

export const cartItemSchema = z.object({
  menu_item_id: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().min(1).max(50),
  notes: sanitizedString(500).optional().default(""),
  modifiers: z.array(modifierSchema).max(20).default([]),
});

export const createOrderSchema = z.object({
  qr_token: z.string().uuid("Invalid table QR token"),
  idempotency_key: z.string().uuid("Invalid idempotency key").optional(),
  customer_name: sanitizedString(100).optional(),
  customer_phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{7,15}$/, "Invalid phone number format")
    .optional(),
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty").max(50),
  payment_method: z.enum(["counter", "online"]).default("counter"),
  reservation_code: z.string().regex(/^[A-Za-z0-9]{6}$/).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
  "rejected",
]);

export const paymentStatusEnum = z.enum(["unpaid", "paid", "refunded"]);

export const patchOrderSchema = z.object({
  status: orderStatusEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
  delay_minutes: z.number().int().min(0).max(120).optional(),
  delay_reason: sanitizedString(200).optional(),
  priority: z.boolean().optional(),
});

/**
 * A5: split tender must exactly equal the order total.
 * Rejects fractional paise, negatives, and short/over payment.
 */
export function validateSplitTender(
  totalPaise: number,
  cashPaise: number,
  upiPaise: number,
): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(totalPaise) || totalPaise <= 0) {
    return { ok: false, error: "Invalid order total" };
  }
  if (!Number.isInteger(cashPaise) || cashPaise < 0) {
    return { ok: false, error: "Cash amount must be a non-negative integer (paise)" };
  }
  if (!Number.isInteger(upiPaise) || upiPaise < 0) {
    return { ok: false, error: "UPI amount must be a non-negative integer (paise)" };
  }
  if (cashPaise === 0 && upiPaise === 0) {
    return { ok: false, error: "Split payment requires cash and/or UPI amounts" };
  }
  const sum = cashPaise + upiPaise;
  if (sum !== totalPaise) {
    return {
      ok: false,
      error: `Split amounts must equal order total (expected ${totalPaise} paise, got ${sum})`,
    };
  }
  return { ok: true };
}

/** A15: Indian GSTIN — 15 chars, /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/ */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function normalizeGstin(raw: string): string {
  return String(raw || "").replace(/\s+/g, "").toUpperCase();
}

export function isValidGstin(raw: string): boolean {
  const g = normalizeGstin(raw);
  return g.length === 15 && GSTIN_RE.test(g);
}

