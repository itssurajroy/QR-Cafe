// Copyright (c) 2026 QRslice. All rights reserved.
import type {
  WhatsAppTemplate,
} from "@/integrations/whatsapp/whatsapp.types";
import { buildOrderAgainLink } from "@/lib/whatsapp-templates";

export const ORDER_CONFIRMED_TEMPLATE_NAME = "order_confirmed" as const;

export interface OrderConfirmationItem {
  name: string;
  qty: number;
  pricePaise?: number;
}

export interface OrderConfirmationInput {
  orderNumber: string | number;
  tableLabel?: string | null;
  items: OrderConfirmationItem[];
  totalPaise?: number;
  etaMinutes?: number;
  restaurantName?: string;
  statusToken?: string;
}

export interface OrderConfirmationVars {
  orderNumber: string;
  tableLabel: string;
  items: OrderConfirmationItem[];
  totalPaise?: number;
  etaMinutes?: number;
  restaurantName?: string;
  statusToken?: string;
}

/**
 * Normalize raw order input into template variables.
 * Pure function — no transport calls.
 */
export function buildOrderConfirmationVars(
  input: OrderConfirmationInput,
): OrderConfirmationVars {
  return {
    orderNumber: String(input.orderNumber),
    tableLabel: input.tableLabel?.trim() ? String(input.tableLabel) : "Counter",
    items: input.items ?? [],
    totalPaise: input.totalPaise,
    etaMinutes: input.etaMinutes,
    restaurantName: input.restaurantName,
    statusToken: input.statusToken,
  };
}

function formatRupees(totalPaise?: number): string | null {
  if (totalPaise === undefined || totalPaise === null) return null;
  return `Rs.${(totalPaise / 100).toFixed(2)}`;
}

/**
 * Render the order confirmation as plain text.
 * The Baileys client sends this text via `sendTemplate`.
 */
export function renderOrderConfirmationText(vars: OrderConfirmationVars): string {
  const lines: string[] = [];
  lines.push(`Order #${vars.orderNumber} confirmed`);
  lines.push(`Table ${vars.tableLabel}`);
  if (vars.restaurantName?.trim()) {
    lines.push(vars.restaurantName.trim());
  }
  if (vars.items.length > 0) {
    lines.push("");
    for (const item of vars.items) {
      lines.push(`${item.qty}x ${item.name}`);
    }
  }
  const total = formatRupees(vars.totalPaise);
  if (total) {
    lines.push("");
    lines.push(`Total: ${total}`);
  }
  if (vars.etaMinutes !== undefined && vars.etaMinutes !== null) {
    lines.push(`Ready in ~${vars.etaMinutes} min`);
  }
  // Baileys sends plain text only, so the Order Again deep link goes in
  // as a text line rather than an interactive button.
  if (vars.statusToken?.trim()) {
    lines.push("");
    lines.push(`Order again: ${buildOrderAgainLink({ statusToken: vars.statusToken.trim() })}`);
  }
  return lines.join("\n");
}

/**
 * Build the transport-agnostic WhatsAppTemplate for an order confirmation.
 * Output only — never performs Baileys socket calls.
 */
export function buildOrderConfirmedTemplate(
  vars: OrderConfirmationVars,
): WhatsAppTemplate {
  const itemSummary = vars.items.map((i) => `${i.qty}x ${i.name}`).join(", ");
  const total = formatRupees(vars.totalPaise) ?? "";
  const eta = vars.etaMinutes !== undefined && vars.etaMinutes !== null
    ? `~${vars.etaMinutes} min`
    : "";

  return {
    name: ORDER_CONFIRMED_TEMPLATE_NAME,
    language: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: vars.orderNumber },
          { type: "text", text: vars.tableLabel },
          { type: "text", text: itemSummary },
          { type: "text", text: total },
          { type: "text", text: eta },
        ],
      },
    ],
  };
}

/**
 * Render a named template to plain text.
 */
export function renderTemplate(
  templateName: string,
  vars: OrderConfirmationVars,
): string {
  if (templateName === ORDER_CONFIRMED_TEMPLATE_NAME) {
    return renderOrderConfirmationText(vars);
  }
  throw new Error(`Unknown template: ${templateName}`);
}
