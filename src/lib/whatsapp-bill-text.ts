// Copyright (c) 2026 QRslice. All rights reserved.

export interface BillItemInput {
  name: string;
  quantity: number;
  pricePaise: number; // line total in paise
}

export interface BillReceiptInput {
  restaurantName: string;
  restaurantGstin?: string | null;
  orderNumber: string;
  tableLabel?: string | null;
  items: BillItemInput[];
  totalPaise: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  receiptUrl: string;
}

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function toWhatsAppJid(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, "");
  let digits = cleaned.replace(/^\+/, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("91") && digits.length === 12) {
    // already country-coded
  } else if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    digits = `91${digits}`;
  } else if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  if (!/^\d{10,15}$/.test(digits)) return null;
  return `${digits}@s.whatsapp.net`;
}

export function buildBillReceiptText(input: BillReceiptInput): string {
  const lines: string[] = [];
  lines.push(`*${input.restaurantName}*`);
  if (input.restaurantGstin) lines.push(`GSTIN: ${input.restaurantGstin}`);
  const table = input.tableLabel || "Counter";
  lines.push(`Order #${input.orderNumber} • Table ${table}`);
  lines.push("");
  for (const item of input.items) {
    lines.push(`${item.quantity} x ${item.name} — ${formatINR(item.pricePaise)}`);
  }
  if (input.items.length === 0) lines.push("(no line items)");
  lines.push("");
  lines.push(`*Total: ${formatINR(input.totalPaise)}*`);
  const paid = input.paymentStatus === "paid";
  lines.push(paid ? `Paid via ${input.paymentMethod || "unknown"}` : "Payment pending");
  lines.push(`View receipt: ${input.receiptUrl}`);
  lines.push("Thank you! 🙏");
  return lines.join("\n");
}
