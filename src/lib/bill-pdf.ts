// Copyright (c) 2026 QRslice. All rights reserved.

export interface BillPdfOptions {
  restaurant: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    fssai?: string;
    logo_url?: string;
  };
  order: {
    id?: string;
    order_number: string;
    table_label: string;
    order_type?: string;
    created_at?: string;
    subtotal_paise?: number;
    discount_paise?: number;
    tax_paise?: number;
    tax_rate?: number;
    total_paise: number;
    payment_status: string;
    payment_method?: string;
    cashier_name?: string;
    amount_received_paise?: number;
    change_due_paise?: number;
    customer_name?: string;
    customer_phone?: string;
  };
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price_paise: number;
    notes?: string;
  }>;
}

export async function generateBeautifulBillPdf(opts: BillPdfOptions) {
  const mod: any = await import("jspdf");
  const Doc = mod.jsPDF || mod.default;

  // Estimate document height based on items count
  const estimatedHeight = Math.max(160, 110 + opts.items.length * 9);
  const doc = new Doc({ unit: "mm", format: [80, estimatedHeight] });
  const W = 80;
  let y = 0;

  const rName = opts.restaurant.name || "QRslice";
  const isPaid = opts.order.payment_status === "paid";

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
  if (opts.restaurant.address) {
    const addressLines = doc.splitTextToSize(opts.restaurant.address, W - 10);
    addressLines.forEach((line: string) => {
      doc.text(line, W / 2, y, { align: "center" });
      y += 3;
    });
  }

  const contactParts: string[] = [];
  if (opts.restaurant.phone) contactParts.push(`Ph: ${opts.restaurant.phone}`);
  if (opts.restaurant.email) contactParts.push(opts.restaurant.email);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(" | "), W / 2, y, { align: "center" });
    y += 3.5;
  }

  const regParts: string[] = [];
  if (opts.restaurant.gstin) regParts.push(`GSTIN: ${opts.restaurant.gstin}`);
  if (opts.restaurant.fssai) regParts.push(`FSSAI Lic: ${opts.restaurant.fssai}`);
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
  doc.text(`Invoice #: INV-${opts.order.order_number}`, 4, y);
  doc.text(`Date: ${new Date(opts.order.created_at || Date.now()).toLocaleDateString("en-IN")}`, W - 4, y, { align: "right" });
  y += 3.5;

  doc.setFont("helvetica", "normal");
  doc.text(`Time: ${new Date(opts.order.created_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`, 4, y);
  doc.text(`Table: ${opts.order.table_label || "Counter"} (${opts.order.order_type || "Dine-In"})`, W - 4, y, { align: "right" });
  y += 3.5;

  if (opts.order.customer_name || opts.order.customer_phone) {
    doc.text(`Customer: ${opts.order.customer_name || "Walk-in"} ${opts.order.customer_phone ? `(${opts.order.customer_phone})` : ""}`, 4, y);
    y += 3.5;
  }
  if (opts.order.cashier_name) {
    doc.text(`Staff / Terminal: ${opts.order.cashier_name}`, 4, y);
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
  opts.items.forEach((it) => {
    let unitPrice = it.unit_price_paise || (it as any).price_paise || (it as any).unitPricePaise || 0;
    if (!unitPrice && opts.order.total_paise && opts.items.length > 0) {
      const totalItemsCount = opts.items.reduce((s, x) => s + (x.quantity || 1), 0);
      unitPrice = Math.round((opts.order.total_paise || 0) / Math.max(1, totalItemsCount));
    }
    const itemTotalPaise = unitPrice * (it.quantity || 1);
    const nameLines = doc.splitTextToSize(it.item_name || "Item", 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(nameLines[0], 6, y);
    doc.text(String(it.quantity || 1), 44, y, { align: "center" });
    doc.text(`Rs.${(unitPrice / 100).toFixed(2)}`, 58, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rs.${(itemTotalPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
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
  const rawSubtotalPaise = opts.order.subtotal_paise || opts.items.reduce((s, i) => s + i.unit_price_paise * i.quantity, 0);
  const discountPaise = opts.order.discount_paise || 0;
  const netPaise = Math.max(0, rawSubtotalPaise - discountPaise);

  // 5% GST calculation standard for F&B in India (2.5% CGST + 2.5% SGST)
  const taxRate = opts.order.tax_rate ?? 5; // default 5%
  const totalTaxPaise = opts.order.tax_paise !== undefined ? opts.order.tax_paise : Math.round((netPaise * taxRate) / (100 + taxRate));
  const cgstPaise = Math.round(totalTaxPaise / 2);
  const sgstPaise = totalTaxPaise - cgstPaise;
  const taxableValuePaise = netPaise - totalTaxPaise;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  doc.text("Subtotal:", 6, y);
  doc.text(`Rs.${(rawSubtotalPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 3.5;

  if (discountPaise > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("Discount:", 6, y);
    doc.text(`-Rs.${(discountPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
    doc.setTextColor(15, 23, 42);
    y += 3.5;
  }

  doc.text(`Taxable Value:`, 6, y);
  doc.text(`Rs.${(taxableValuePaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 3.5;

  doc.text(`CGST @ ${(taxRate / 2).toFixed(1)}%:`, 6, y);
  doc.text(`Rs.${(cgstPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 3.5;

  doc.text(`SGST @ ${(taxRate / 2).toFixed(1)}%:`, 6, y);
  doc.text(`Rs.${(sgstPaise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
  y += 4;

  // Grand Total Box
  doc.setFillColor(15, 23, 42);
  doc.rect(4, y, W - 8, 7.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("GRAND TOTAL", 8, y + 5);
  doc.text(`Rs.${(opts.order.total_paise / 100).toFixed(2)}`, W - 8, y + 5, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y += 11;

  // 7. Payment Tender Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(`Payment Mode: ${(opts.order.payment_method || "CASH").toUpperCase()}`, 6, y);
  y += 3.5;

  if (opts.order.amount_received_paise && opts.order.amount_received_paise > 0) {
    doc.setFont("helvetica", "normal");
    doc.text(`Amount Tendered: Rs.${(opts.order.amount_received_paise / 100).toFixed(2)}`, 6, y);
    if (opts.order.change_due_paise !== undefined) {
      doc.text(`Change Returned: Rs.${(opts.order.change_due_paise / 100).toFixed(2)}`, W - 6, y, { align: "right" });
    }
    y += 4;
  }

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

  return doc;
}

export async function generateBillPdfBuffer(opts: {
  restaurant: { name: string; address?: string; phone?: string; gstin?: string; fssai?: string };
  order: {
    order_number: string;
    table_label: string;
    created_at?: string;
    total_paise: number;
    subtotal_paise?: number;
    discount_paise?: number;
    payment_status: string;
    payment_method?: string;
  };
  items: Array<{ item_name: string; quantity: number; unit_price_paise: number }>;
}): Promise<Buffer> {
  const doc = await generateBeautifulBillPdf({
    restaurant: opts.restaurant,
    order: opts.order,
    items: opts.items,
  });
  return Buffer.from(doc.output("arraybuffer"));
}

