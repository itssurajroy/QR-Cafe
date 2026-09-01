export async function generateBeautifulBillPdf(opts: {
  restaurant: { name: string; address?: string; phone?: string; gstin?: string };
  order: { order_number: string; table_label: string; created_at?: string; total_paise: number; subtotal_paise?: number; discount_paise?: number; payment_status: string; payment_method?: string };
  items: Array<{ item_name: string; quantity: number; unit_price_paise: number }>;
}) {
  const mod: any = await import("jspdf");
  const Doc = mod.jsPDF || mod.default;
  const doc = new Doc({ unit: "mm", format: [80, 200] });
  const W = 80;
  let y = 8;

  // Header — amber band
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, W, 18, "F");
  doc.setTextColor(12, 10, 9);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text(opts.restaurant.name.toUpperCase(), W/2, 9, { align: "center" });
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  doc.text(`${opts.restaurant.address || ""}`, W/2, 12, { align: "center" });
  doc.text(`${opts.restaurant.phone || ""} ${opts.restaurant.gstin ? "• GSTIN: "+opts.restaurant.gstin : ""}`, W/2, 15, { align: "center" });

  // Bill meta
  y = 22;
  doc.setTextColor(28, 25, 23);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.text(`Bill: ${opts.order.order_number}`, 4, y);
  doc.text(`Table: ${opts.order.table_label}`, W-4, y, { align: "right" });
  y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(6);
  doc.text(new Date(opts.order.created_at || Date.now()).toLocaleString("en-IN"), 4, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  const status = opts.order.payment_status === "paid" ? "PAID ✓" : "UNPAID — COLLECT AT COUNTER";
  const statusColor = opts.order.payment_status === "paid" ? [16, 185, 129] : [239, 68, 68];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(4, y+2, W-8, 7, 1, 1, "F");
  doc.setTextColor(255,255,255); doc.text(status, W/2, y+6.5, { align: "center" });
  doc.setTextColor(28, 25, 23);
  y += 12;

  // Items header
  doc.setFontSize(6); doc.setFont("helvetica", "bold");
  doc.setFillColor(245, 245, 244); doc.rect(4, y, W-8, 6, "F");
  doc.text("ITEM", 5, y+4); doc.text("QTY", 42, y+4); doc.text("AMT", W-5, y+4, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");
  opts.items.forEach((it) => {
    if (y > 185) { doc.addPage(); y = 10; }
    doc.setFontSize(6);
    const name = it.item_name.length > 22 ? it.item_name.slice(0,22) : it.item_name;
    doc.text(name, 5, y+4);
    doc.text(String(it.quantity), 43, y+4, { align: "center" });
    doc.text(`₹${((it.unit_price_paise * it.quantity)/100).toFixed(2)}`, W-5, y+4, { align: "right" });
    doc.setDrawColor(231, 229, 228); doc.line(4, y+6, W-4, y+6);
    y += 6;
  });

  // Totals
  y += 2;
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  doc.text("Subtotal", 5, y); doc.text(`₹${((opts.order.subtotal_paise || opts.order.total_paise)/100).toFixed(2)}`, W-5, y, { align: "right" }); y += 4;
  if ((opts.order.discount_paise || 0) > 0) {
    doc.setTextColor(16, 185, 129); doc.text("Discount", 5, y); doc.text(`-₹${(opts.order.discount_paise!/100).toFixed(2)}`, W-5, y, { align: "right" }); y += 4; doc.setTextColor(28, 25, 23);
  }
  doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.5); doc.line(4, y, W-4, y); y += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("TOTAL", 5, y); doc.text(`₹${(opts.order.total_paise/100).toFixed(2)}`, W-5, y, { align: "right" }); y += 6;
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 113, 108);
  doc.text(`Payment: ${opts.order.payment_method || "cash"} • ${opts.order.payment_status}`, 5, y); y += 4;

  // Footer — hospitality
  doc.setFillColor(28, 25, 23); doc.rect(0, 190, W, 10, "F");
  doc.setTextColor(245, 158, 11); doc.setFontSize(6); doc.setFont("helvetica", "bold");
  doc.text("Thank you — Visit again! • Powered by QR Café", W/2, 196, { align: "center" });

  return doc;
}
