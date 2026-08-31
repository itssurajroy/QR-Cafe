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
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "cancelled",
  "rejected",
]);

export const paymentStatusEnum = z.enum(["unpaid", "paid", "refunded"]);

export const patchOrderSchema = z.object({
  status: orderStatusEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
});
