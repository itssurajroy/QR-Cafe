// Copyright (c) 2026 QRslice. All rights reserved.
import { jsPDF } from "jspdf";

export interface InvoiceRestaurant {
  name: string;
  address?: string | null;
  phone?: string | null;
  gstin?: string | null;
  currency: string;
}

export interface InvoiceOrder {
  id: string;
  order_number: string;
  table_label: string;
  created_at?: string | null;
  subtotal_paise?: number;
  discount_paise?: number;
  tax_paise?: number;
  tax_rate?: number;
  total_paise: number;
  payment_status: string;
  payment_method?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
}

export interface InvoiceItem {
  item_name: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  notes?: string | null;
}

export interface InvoiceTax {
  taxable_value_paise: number;
  tax_rate: number;
  cgst_paise: number;
  sgst_paise: number;
  total_tax_paise: number;
}

export interface InvoiceData {
  restaurant: InvoiceRestaurant;
  order: InvoiceOrder;
  items: InvoiceItem[];
  tax: InvoiceTax;
}

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({ unit: "mm", format: [80, 297] });
  const W = 80;
  let y = 0;

  const rName = data.restaurant.name || "QRslice";
  const isPaid = data.order.payment_status === "paid";

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, W, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(isPaid ? "TAX INVOICE" : "OFFICIAL BILL MEMO", W / 2, 5.5, { align: "center" });

  doc.setFontSize(10);
  doc.text(rName.toUpperCase(), W / 2, 11, { align: "center" });

  y = 17;
  doc.setTextColor(15, 23, 42);

  // 2. Restaurant Metadata
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  if (data.restaurant.address) {
    const addressLines = doc.splitTextToSize(data.restaurant.address, W - 10);
    addressLines.forEach((line: string) => {
      doc.text(line, W / 2, y, { align: "center" });
      y += 3;
    });
  }

  const contactParts: string[] = [];
  if (data.restaurant.phone) contactParts.push(`Ph: ${data.restaurant.phone}`);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(" | "), W / 2, y, { align: "center" });
    y += 3.5;
  }

  const regParts: string[] = [];
  if (data.restaurant.gstin) regParts.push(`GSTIN: ${data.restaurant.gstin}`);
  if (regParts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text(regParts.join(" | "), W / 2, y, { align: "center" });
    y += 4;
  }

  // Divider
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.line(4, y, W - 4, y);
  y += 4;

  // 3. Bill Meta Info Grid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(`Invoice #: INV-${data.order.order_number}`, 4, y);
  doc.text(`Date: ${new Date(data.order.created_at || Date.now()).toLocaleDateString("en-IN")}`, W - 4, y, { align: "right" });
  y += 3.5;

  doc.setFont("helvetica", "normal");
  doc.text(`Time: ${new Date(data.order.created_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`, 4, y);
  doc.text(`Table: ${data.order.table_label}`, W - 4, y, { align: "right" });
  y += 3.5;

  if (data.order.customer_name || data.order.customer_phone) {
    doc.text(`Customer: ${data.order.customer_name || "Walk-in"} ${data.order.customer_phone ? `(${data.order.customer_phone})` : ""}`, 4, y);
    y += 3.5;
  }

  // Status Banner
  y += 1;
  const statusText = isPaid ? "[PAID] PAYMENT RECEIVED - THANK YOU" : "[UNPAID] PLEASE COLLECT AT COUNTER";
  doc.setFillColor(isPaid ? 16 : 225, isPaid ? 185 : 29, isPaid ? 129 : 72);
  doc.roundedRect(4, y, W - 8, 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(statusText, W / 2, y + 4.2, { align: "center" });
  doc.setTextColor(15, 23, 42);
  y += 9;

  // 4. Line Items Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(4, y, W - 8, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("ITEM DESCRIPTION", 6, y + 3.8);
  doc.text("QTY", 44, y + 3.8, { align: "center" });
  doc.text("RATE", 58, y + 3.8, { align: "right" });
  doc.text("AMOUNT", W - 6, y + 3.8, { align: "right" });
  y += 7;

  // 5. Line Items
  doc.setFont("helvetica", "normal");
  data.items.forEach((it) => {
    const unitPrice = it.unit_price_paise;
    const itemTotalPaise = it.line_total_paise;
    const nameLines = doc.splitTextToSize(it.item_name || "Item", 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(nameLines[0], 6, y);
    doc.text(String(it.quantity), 44, y, { align: "center" });
    doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(unitPrice / 100).toFixed(2)}`, 58, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(itemTotalPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
    y += 3.2;

    // Remaining lines of wrapped item name
    for (let i = 1; i < nameLines.length; i++) {
      doc.text(nameLines[i], 6, y);
      y += 3;
    }

    if (it.notes) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`* ${it.notes}`, 8, y);
      doc.setTextColor(15, 23, 42);
      y += 3;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(4, y, W - 4, y);
    y += 1.5;
  });

  // 6. Totals & Tax Calculation
  y += 2;
  const rawSubtotalPaise = data.order.subtotal_paise || data.items.reduce((s, i) => s + i.line_total_paise, 0);
  const discountPaise = data.order.discount_paise || 0;
  const netPaise = Math.max(0, rawSubtotalPaise - discountPaise);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  doc.text("Subtotal:", 6, y);
  doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(rawSubtotalPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 3.5;

  if (discountPaise > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("Discount:", 6, y);
    doc.text(`-${(data.restaurant.currency === "INR" ? "₹" : "")}${(discountPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
    doc.setTextColor(15, 23, 42);
    y += 3.5;
  }

  doc.text("Taxable Value:", 6, y);
  doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(data.tax.taxable_value_paise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 3.5;

  doc.text(`CGST @ ${(data.tax.tax_rate / 2).toFixed(1)}%:`, 6, y);
  doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(data.tax.cgst_paise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 3.5;

  doc.text(`SGST @ ${(data.tax.tax_rate / 2).toFixed(1)}%:`, 6, y);
  doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(data.tax.sgst_paise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 4;

  // Grand Total Box
  doc.setFillColor(15, 23, 42);
  doc.rect(4, y, W - 8, 7.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("GRAND TOTAL", 8, y + 5);
  doc.text(`${(data.restaurant.currency === "INR" ? "₹" : "")}${(data.order.total_paise / 100).toFixed(2)}`, W - 8, y + 5, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y += 11;

  // 7. Payment Tender Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(`Payment Mode: ${(data.order.payment_method || "CASH").toUpperCase()}`, 6, y);
  y += 3.5;

  // 8. Footer & Regulatory Notes
  doc.setDrawColor(203, 213, 225);
  doc.line(4, y, W - 4, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("Thank you for dining with us! Visit again!", W / 2, y, { align: "center" });
  y += 3.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Goods once sold will not be returned or exchanged.", W / 2, y, { align: "center" });
  y += 3;
  doc.text("Powered by QRslice | www.qrslice.com", W / 2, y, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}