// Copyright (c) 2026 QRslice. All rights reserved.
import type {
  WhatsAppTemplate,
} from "@/integrations/whatsapp/whatsapp.types";

export const PAYMENT_RECEIVED_TEMPLATE_NAME = "payment_received" as const;
export const REFUND_PROCESSED_TEMPLATE_NAME = "refund_processed" as const;

export interface PaymentReceivedInput {
  orderNumber: string | number;
  amount?: string | number;
  amountPaise?: number;
  paymentMethod?: string;
}

export interface PaymentReceivedVars {
  orderNumber: string;
  amount: string;
  amountPaise?: number;
  paymentMethod?: string;
}

export interface RefundProcessedInput {
  orderNumber: string | number;
  refundAmount: string | number;
  refundAmountPaise?: number;
  refundReason?: string;
}

export interface RefundProcessedVars {
  orderNumber: string;
  refundAmount: string;
  refundAmountPaise?: number;
  refundReason?: string;
}

type LooseVars = Record<string, unknown>;

function str(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function formatRupees(amountPaise?: number): string | null {
  if (amountPaise === undefined || amountPaise === null) return null;
  return `Rs.${(amountPaise / 100).toFixed(2)}`;
}

/**
 * Normalize raw payment input into template variables.
 * Pure function — no transport calls.
 */
export function buildPaymentReceivedVars(input: PaymentReceivedInput): PaymentReceivedVars {
  const fromPaise =
    input.amount === undefined ? formatRupees(input.amountPaise) : null;
  return {
    orderNumber: str(input.orderNumber),
    amount: input.amount !== undefined ? str(input.amount) : (fromPaise ?? ""),
    ...(input.amountPaise !== undefined ? { amountPaise: input.amountPaise } : {}),
    ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
  };
}

/**
 * Normalize raw refund input into template variables.
 * Pure function — no transport calls.
 */
export function buildRefundProcessedVars(input: RefundProcessedInput): RefundProcessedVars {
  return {
    orderNumber: str(input.orderNumber),
    refundAmount:
      formatRupees(input.refundAmountPaise) ?? str(input.refundAmount),
    ...(input.refundAmountPaise !== undefined
      ? { refundAmountPaise: input.refundAmountPaise }
      : {}),
    ...(input.refundReason !== undefined ? { refundReason: input.refundReason } : {}),
  };
}

function normalizePaymentLoose(vars: LooseVars): PaymentReceivedVars {
  return buildPaymentReceivedVars({
    orderNumber: str(vars["orderNumber"] ?? vars["order_number"] ?? vars["orderNo"] ?? ""),
    ...(vars["amount"] !== undefined
      ? { amount: str(vars["amount"]) }
      : vars["amountPaise"] !== undefined
        ? { amountPaise: Number(vars["amountPaise"]) }
        : {}),
    ...((vars["paymentMethod"] ?? vars["payment_method"]) !== undefined
      ? { paymentMethod: str(vars["paymentMethod"] ?? vars["payment_method"]) }
      : {}),
  });
}

function normalizeRefundLoose(vars: LooseVars): RefundProcessedVars {
  return buildRefundProcessedVars({
    orderNumber: str(vars["orderNumber"] ?? vars["order_number"] ?? vars["orderNo"] ?? ""),
    refundAmount: str(
      vars["refundAmount"] ?? vars["refund_amount"] ?? vars["amount"] ?? "",
    ),
    ...(vars["refundAmountPaise"] !== undefined
      ? { refundAmountPaise: Number(vars["refundAmountPaise"]) }
      : {}),
    ...((vars["refundReason"] ?? vars["refund_reason"] ?? vars["reason"]) !== undefined
      ? {
          refundReason: str(
            vars["refundReason"] ?? vars["refund_reason"] ?? vars["reason"],
          ),
        }
      : {}),
  });
}

/**
 * Render payment_received as plain text.
 */
export function renderPaymentReceivedText(vars: PaymentReceivedVars): string {
  const lines: string[] = [];
  lines.push(`Payment of ${vars.amount} received for order #${vars.orderNumber}`);
  if (vars.paymentMethod?.trim()) {
    lines.push(`Paid via ${vars.paymentMethod.trim()}`);
  }
  return lines.join("\n");
}

/**
 * Render refund_processed as plain text.
 */
export function renderRefundProcessedText(vars: RefundProcessedVars): string {
  const lines: string[] = [];
  lines.push(`Your refund of ${vars.refundAmount} for order #${vars.orderNumber} has been processed`);
  if (vars.refundReason?.trim()) {
    lines.push(`Reason: ${vars.refundReason.trim()}`);
  }
  return lines.join("\n");
}

/**
 * Build transport-agnostic WhatsAppTemplates for payment events.
 * Output only — never performs Baileys socket calls.
 */
export function buildPaymentReceivedTemplate(vars: PaymentReceivedVars): WhatsAppTemplate {
  return {
    name: PAYMENT_RECEIVED_TEMPLATE_NAME,
    language: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: vars.orderNumber },
          { type: "text", text: vars.amount },
          { type: "text", text: vars.paymentMethod ?? "" },
        ],
      },
    ],
  };
}

export function buildRefundProcessedTemplate(vars: RefundProcessedVars): WhatsAppTemplate {
  return {
    name: REFUND_PROCESSED_TEMPLATE_NAME,
    language: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: vars.orderNumber },
          { type: "text", text: vars.refundAmount },
          { type: "text", text: vars.refundReason ?? "" },
        ],
      },
    ],
  };
}

/**
 * Render a named payment template to plain text.
 */
export function renderTemplate(
  templateName: string,
  vars: PaymentReceivedVars | RefundProcessedVars | LooseVars,
): string {
  switch (templateName) {
    case PAYMENT_RECEIVED_TEMPLATE_NAME:
      return renderPaymentReceivedText(normalizePaymentLoose(vars as LooseVars));
    case REFUND_PROCESSED_TEMPLATE_NAME:
      return renderRefundProcessedText(normalizeRefundLoose(vars as LooseVars));
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}
