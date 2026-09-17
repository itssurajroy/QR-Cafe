// Copyright (c) 2026 QRslice. All rights reserved.

export interface TemplateVars {
  restaurant: {
    name: string;
    gstin?: string;
  };
  orderNumber: string;
  tableNumber: string;
  total: string;
  paymentModeLine: string;
  receiptUrl: string;
}

/**
 * WhatsApp Settings with Cloud API credentials.
 * Combines behavioral settings (whatsapp_settings table) with
 * Meta Cloud API credentials (whatsapp_accounts table).
 */
export interface WhatsAppSettings {
  // Behavioral settings (from whatsapp_settings)
  enabled: boolean;
  message_template: string;
  include_review_cta: boolean;
  include_gstin_line: boolean;
  thank_you_line: string;
  // Cloud API credentials (from whatsapp_accounts)
  phone_number_id: string;
  access_token: string;
  business_account_id: string;
  verify_token: string;
  webhook_url: string;
  webhook_secret: string;
  // Common
  tenant_id: string;
}

export const DEFAULT_WA_TEMPLATE = `Thanks for visiting {restaurant.name} 🧾

Order #{orderNumber} • Table {tableNumber}
Total: ₹{total} {paymentModeLine}

View your receipt & leave a review:
{receiptUrl}`;

/**
 * Render a customized WhatsApp message template using dynamic order & restaurant parameters.
 * @param template The template string containing placeholders.
 * @param vars The dynamic variables to inject.
 * @param preview If true, missing fields render as `[MISSING: token]` for debugging in admin preview.
 */
export function renderWhatsAppMessage(
  template: string | null | undefined,
  vars: TemplateVars,
  preview = false,
): string {
  const activeTemplate =
    template && template.trim().length > 0 ? template : DEFAULT_WA_TEMPLATE;

  const valueFor = (val: string | undefined | null, token: string): string => {
    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      return String(val);
    }
    return preview ? `[MISSING: ${token}]` : "";
  };

  let rendered = activeTemplate
    .replace(/{restaurant\.name}/g, valueFor(vars.restaurant?.name, "restaurant.name"))
    .replace(/{restaurant\.gstin}/g, valueFor(vars.restaurant?.gstin, "restaurant.gstin"))
    .replace(/{orderNumber}/g, valueFor(vars.orderNumber, "orderNumber"))
    .replace(/{tableNumber}/g, valueFor(vars.tableNumber, "tableNumber"))
    .replace(/{total}/g, valueFor(vars.total, "total"))
    .replace(/{paymentModeLine}/g, valueFor(vars.paymentModeLine, "paymentModeLine"))
    .replace(/{receiptUrl}/g, valueFor(vars.receiptUrl, "receiptUrl"));

  // Handle any remaining unknown `{token}` placeholders
  rendered = rendered.replace(/{([^{}]+)}/g, (_match, token) => {
    return preview ? `[UNKNOWN: ${token}]` : "";
  });

  // Preserve newlines while trimming trailing line spaces
  return rendered
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Convenience helper to build standard TemplateVars from restaurant and order records.
 */
export function buildWhatsAppReceiptVars(params: {
  restaurantName: string;
  restaurantGstin?: string;
  orderNumber: string | number;
  tableLabel?: string | null;
  totalPaise: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  receiptUrl: string;
}): TemplateVars {
  const formattedTotal = (params.totalPaise / 100).toFixed(2);
  let paymentModeLine = "";
  if (params.paymentMethod) {
    paymentModeLine = `• Paid via ${params.paymentMethod.toUpperCase()}`;
  } else if (params.paymentStatus === "paid") {
    paymentModeLine = `• Paid`;
  }

  return {
    restaurant: {
      name: params.restaurantName,
      gstin: params.restaurantGstin,
    },
    orderNumber: String(params.orderNumber),
    tableNumber: params.tableLabel || "Dine-in",
    total: formattedTotal,
    paymentModeLine,
    receiptUrl: params.receiptUrl,
  };
}
