// Copyright (c) 2026 QRslice. All rights reserved.
import type {
  WhatsAppTemplate,
} from "@/integrations/whatsapp/whatsapp.types";

export const ORDER_ACCEPTED_TEMPLATE_NAME = "order_accepted" as const;
export const PREPARING_TEMPLATE_NAME = "preparing" as const;
export const READY_TEMPLATE_NAME = "ready" as const;
export const SERVED_TEMPLATE_NAME = "served" as const;

export interface OrderStatusInput {
  orderNumber: string | number;
  tableLabel?: string | null;
  etaMinutes?: number;
  restaurantName?: string;
  itemsSummary?: string;
}

export interface OrderStatusVars {
  orderNumber: string;
  tableLabel: string;
  etaMinutes?: number;
  restaurantName?: string;
  itemsSummary?: string;
}

type LooseVars = Record<string, unknown>;

function str(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalizeTableLabel(value: unknown): string {
  const label = str(value).trim();
  return label ? label : "Counter";
}

/**
 * Normalize raw order input into template variables.
 * Pure function — no transport calls.
 */
export function buildOrderAcceptedVars(input: OrderStatusInput): OrderStatusVars {
  return {
    orderNumber: str(input.orderNumber),
    tableLabel: normalizeTableLabel(input.tableLabel),
    ...(input.etaMinutes !== undefined ? { etaMinutes: input.etaMinutes } : {}),
    ...(input.restaurantName !== undefined ? { restaurantName: input.restaurantName } : {}),
    ...(input.itemsSummary !== undefined ? { itemsSummary: input.itemsSummary } : {}),
  };
}

export function buildPreparingVars(input: OrderStatusInput): OrderStatusVars {
  return buildOrderAcceptedVars(input);
}

export function buildReadyVars(input: OrderStatusInput): OrderStatusVars {
  return buildOrderAcceptedVars(input);
}

export function buildServedVars(input: OrderStatusInput): OrderStatusVars {
  return buildOrderAcceptedVars(input);
}

function normalizeLoose(vars: LooseVars): OrderStatusVars {
  return buildOrderAcceptedVars({
    orderNumber: str(vars["orderNumber"] ?? vars["order_number"] ?? vars["orderNo"] ?? ""),
    tableLabel: (vars["tableLabel"] ?? vars["table_number"] ?? vars["table"] ?? undefined) as
      | string
      | undefined,
    ...(vars["etaMinutes"] !== undefined ? { etaMinutes: Number(vars["etaMinutes"]) } : {}),
    ...((vars["restaurantName"] ?? vars["restaurant_name"]) !== undefined
      ? { restaurantName: str(vars["restaurantName"] ?? vars["restaurant_name"]) }
      : {}),
    ...((vars["itemsSummary"] ?? vars["items_summary"] ?? vars["items"]) !== undefined
      ? {
          itemsSummary: Array.isArray(vars["items"])
            ? (vars["items"] as Array<{ name?: unknown; qty?: unknown }>)
                .map((i) => `${str(i.qty ?? 1)}x ${str(i.name)}`)
                .join(", ")
            : str(vars["itemsSummary"] ?? vars["items_summary"] ?? vars["items"]),
        }
      : {}),
  });
}

/**
 * Render the order-accepted status as plain text.
 */
export function renderOrderAcceptedText(vars: OrderStatusVars): string {
  const lines: string[] = [];
  lines.push(`Order #${vars.orderNumber} accepted`);
  lines.push(`Table ${vars.tableLabel}`);
  if (vars.restaurantName?.trim()) {
    lines.push(vars.restaurantName.trim());
  }
  if (vars.etaMinutes !== undefined && vars.etaMinutes !== null) {
    lines.push(`Ready in ~${vars.etaMinutes} min`);
  }
  return lines.join("\n");
}

export function renderPreparingText(vars: OrderStatusVars): string {
  const lines: string[] = [];
  lines.push(`Order #${vars.orderNumber} is being prepared`);
  lines.push(`Table ${vars.tableLabel}`);
  if (vars.itemsSummary?.trim()) {
    lines.push(vars.itemsSummary.trim());
  }
  return lines.join("\n");
}

export function renderReadyText(vars: OrderStatusVars): string {
  return [`Order #${vars.orderNumber} is ready`, `Table ${vars.tableLabel}`].join("\n");
}

export function renderServedText(vars: OrderStatusVars): string {
  return [
    `Order #${vars.orderNumber} served`,
    `Table ${vars.tableLabel}`,
    "Thank you for dining with us!",
  ].join("\n");
}

function bodyParams(texts: string[]): WhatsAppTemplate["components"] {
  return [
    {
      type: "body",
      parameters: texts.map((text) => ({ type: "text" as const, text })),
    },
  ];
}

/**
 * Build transport-agnostic WhatsAppTemplates for order status updates.
 * Output only — never performs Baileys socket calls.
 */
export function buildOrderAcceptedTemplate(vars: OrderStatusVars): WhatsAppTemplate {
  return {
    name: ORDER_ACCEPTED_TEMPLATE_NAME,
    language: "en",
    components: bodyParams([
      vars.orderNumber,
      vars.tableLabel,
      vars.etaMinutes !== undefined && vars.etaMinutes !== null
        ? `~${vars.etaMinutes} min`
        : "",
      vars.restaurantName ?? "",
    ]),
  };
}

export function buildPreparingTemplate(vars: OrderStatusVars): WhatsAppTemplate {
  return {
    name: PREPARING_TEMPLATE_NAME,
    language: "en",
    components: bodyParams([vars.orderNumber, vars.tableLabel, vars.itemsSummary ?? ""]),
  };
}

export function buildReadyTemplate(vars: OrderStatusVars): WhatsAppTemplate {
  return {
    name: READY_TEMPLATE_NAME,
    language: "en",
    components: bodyParams([vars.orderNumber, vars.tableLabel]),
  };
}

export function buildServedTemplate(vars: OrderStatusVars): WhatsAppTemplate {
  return {
    name: SERVED_TEMPLATE_NAME,
    language: "en",
    components: bodyParams([vars.orderNumber, vars.tableLabel]),
  };
}

/**
 * Render a named order-status template to plain text.
 */
export function renderTemplate(templateName: string, vars: OrderStatusVars | LooseVars): string {
  const normalized = normalizeLoose(vars as LooseVars);
  switch (templateName) {
    case ORDER_ACCEPTED_TEMPLATE_NAME:
      return renderOrderAcceptedText(normalized);
    case PREPARING_TEMPLATE_NAME:
      return renderPreparingText(normalized);
    case READY_TEMPLATE_NAME:
      return renderReadyText(normalized);
    case SERVED_TEMPLATE_NAME:
      return renderServedText(normalized);
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}
