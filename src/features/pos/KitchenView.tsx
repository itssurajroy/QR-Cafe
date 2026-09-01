import { useState } from "react";
import { KitchenOrderCard } from "./KitchenOrderCard";

interface KitchenViewProps {
  liveOrders: any[];
  fetchLiveOrders: () => void;
  handleUpdateOrderStatus: (
    id: string,
    status: string,
    orderNumber: string,
    tableLabel: string
  ) => void;
  restaurant?: any;
}

export function KitchenView({
  liveOrders,
  fetchLiveOrders,
  handleUpdateOrderStatus,
  restaurant,
}: KitchenViewProps) {
  const [collectOrder, setCollectOrder] = useState<any>(null);
  const [collectPhone, setCollectPhone] = useState("");

  const handleServe = (id: string, status: string, orderNumber: string, tableLabel: string) => {
    const order = liveOrders.find((o) => o.id === id);
    handleUpdateOrderStatus(id, status, orderNumber, tableLabel);
    if (status === "served") {
      setCollectOrder(order);
      setCollectPhone(order?.customer_phone || "");
      if (order?.customer_phone) {
        setTimeout(() => {
          const modPromise = import("jspdf") as any;
          modPromise.then((mod: any) => {
            const Doc = mod.jsPDF || mod.default;
            const doc = new Doc();
            const rName = restaurant?.name || "QR Café";
            doc.setFontSize(16); doc.text(rName, 10, 15);
            doc.setFontSize(10); doc.text(`${restaurant?.address || ""} • ${restaurant?.phone || ""}`, 10, 22);
            doc.text(`Bill: ${order.order_number} • Table: ${order.table_label} • ${new Date().toLocaleString("en-IN")}`, 10, 30);
            doc.setFontSize(12); doc.text(order.payment_status === "paid" ? "PAID" : "UNPAID — Collect at counter", 10, 38);
            let y = 48; doc.setFontSize(10);
            (order.items || []).forEach((it: any) => {
              const line = `${it.item_name} x${it.quantity} — ₹${((it.unit_price_paise || 0) * it.quantity / 100).toFixed(2)}`;
              doc.text(line, 10, y); y += 6;
            });
            doc.setFontSize(12); doc.text(`Total: ₹${(order.total_paise / 100).toFixed(2)}`, 10, y + 4);
            doc.save(`Bill-${order.order_number}.pdf`);
            const text = encodeURIComponent(`Hi! Your bill for Table ${order.table_label} at ${rName} — Bill ${order.order_number} Total ₹${(order.total_paise / 100).toFixed(2)} is ${order.payment_status === "paid" ? "PAID ✓" : "UNPAID — please collect at counter"}. PDF auto-generated.`);
            window.open(`https://wa.me/${String(order.customer_phone).replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
          });
        }, 800);
      }
    }
  };

  const generatePdfAndWhatsApp = async () => {
    if (!collectOrder) return;
    const mod: any = await import("jspdf");
    const Doc = mod.jsPDF || mod.default;
    const doc = new Doc();
    const rName = restaurant?.name || "QR Café";
    doc.setFontSize(16); doc.text(rName, 10, 15);
    doc.setFontSize(10); doc.text(`${restaurant?.address || ""} • ${restaurant?.phone || ""}`, 10, 22);
    doc.text(`Bill: ${collectOrder.order_number} • Table: ${collectOrder.table_label} • ${new Date().toLocaleString("en-IN")}`, 10, 30);
    doc.setFontSize(12); doc.text(collectOrder.payment_status === "paid" ? "PAID" : "UNPAID — Collect at counter", 10, 38);
    let y = 48; doc.setFontSize(10);
    (collectOrder.items || []).forEach((it: any, i: number) => {
      const line = `${it.item_name} x${it.quantity} — ₹${((it.unit_price_paise || it.price_paise || 0) * it.quantity / 100).toFixed(2)}`;
      doc.text(line, 10, y); y += 6;
    });
    doc.setFontSize(12); doc.text(`Total: ₹${(collectOrder.total_paise / 100).toFixed(2)}`, 10, y + 4);
    doc.save(`Bill-${collectOrder.order_number}.pdf`);
    if (collectPhone) {
      const text = encodeURIComponent(`Your bill for Table ${collectOrder.table_label} at ${rName} — Bill ${collectOrder.order_number} Total ₹${(collectOrder.total_paise / 100).toFixed(2)} is ${collectOrder.payment_status === "paid" ? "PAID ✓" : "PENDING — please pay at counter"}. PDF downloaded.`);
      window.open(`https://wa.me/${collectPhone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
    } else {
      const text = encodeURIComponent(`Bill ${collectOrder.order_number} Table ${collectOrder.table_label} Total ₹${(collectOrder.total_paise / 100).toFixed(2)}`);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };
  const columns = [
    {
      status: "pending",
      title: "1. New Tickets 📥",
      color: "border-amber-500/60 bg-amber-950/20 text-amber-400",
      nextLabel: "Accept Order →",
      nextStatus: "confirmed",
    },
    {
      status: "confirmed",
      title: "2. In Queue 📋",
      color: "border-blue-500/60 bg-blue-950/20 text-blue-400",
      nextLabel: "Start Cooking 🔥",
      nextStatus: "preparing",
    },
    {
      status: "preparing",
      title: "3. Cooking Line 🍳",
      color: "border-purple-500/60 bg-purple-950/20 text-purple-400",
      nextLabel: "Mark Ready 🔔",
      nextStatus: "ready",
    },
    {
      status: "ready",
      title: "4. Ready to Serve 🛎️",
      color: "border-emerald-500/60 bg-emerald-950/20 text-emerald-400",
      nextLabel: "Mark Served ✓",
      nextStatus: "served",
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4 no-print">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>🔥 Kitchen Cooking Queue & Expediting</span>
          </h2>
          <p className="text-xs text-stone-400">
            Live tickets routed from table QR scans & counter POS. Advance status with 1
            click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-mono">
            {liveOrders.filter((o) => o.status !== "served").length} Active Cooking Orders
          </span>
          <button
            type="button"
            onClick={fetchLiveOrders}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 cursor-pointer"
          >
            🔄 Refresh Queue
          </button>
        </div>
      </div>

      {/* Kitchen Ticket Columns */}
      <div className="flex-1 overflow-x-auto grid grid-cols-1 md:grid-cols-4 gap-4 pb-2">
        {columns.map((col) => {
          const colOrders = liveOrders.filter((o) => o.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-stone-900/90 border border-stone-800 rounded-3xl p-3 flex flex-col justify-between overflow-hidden shadow-lg"
            >
              <div className="flex justify-between items-center pb-2.5 mb-2 border-b border-stone-800">
                <span className="font-extrabold text-xs text-white">{col.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${col.color}`}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Column Tickets Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    nextStatus={col.nextStatus}
                    nextLabel={col.nextLabel}
                    onUpdateStatus={handleServe}
                  />
                ))}

                {colOrders.length === 0 && (
                  <div className="py-12 text-center text-xs text-stone-600">
                    No orders in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {collectOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setCollectOrder(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl border-t-4 border-amber-500" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-stone-900 text-center">Collect Payment</h3>
            <div className={`${collectOrder.payment_status === "paid" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"} border rounded-xl p-3 text-center`}>
              <p className="text-xs text-stone-600">Table {collectOrder.table_label} • Bill {collectOrder.order_number}</p>
              <p className={`text-xl font-black font-mono ${collectOrder.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>₹{(collectOrder.total_paise / 100).toFixed(2)}</p>
              <p className={`text-xs font-bold ${collectOrder.payment_status === "paid" ? "text-emerald-600" : "text-red-600"}`}>{collectOrder.payment_status === "paid" ? "✓ PAID — No collection needed" : "⚠️ UNPAID — Collect now"}</p>
              <p className="text-xs text-stone-500 mt-1">{collectOrder.customer_phone ? `Bill auto-sent to WhatsApp • ${collectOrder.customer_phone}` : "No phone — enter to WhatsApp"}</p>
            </div>
            <input type="tel" placeholder="Customer WhatsApp 9876543210" value={collectPhone} onChange={(e) => setCollectPhone(e.target.value)} className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            <div className="flex gap-2">
              <button onClick={() => { setCollectOrder(null); }} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs">Mark Collected ✓</button>
              <button onClick={generatePdfAndWhatsApp} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs">WhatsApp Bill PDF 📄</button>
            </div>
            <button onClick={() => setCollectOrder(null)} className="w-full py-2 text-xs text-stone-500">Close</button>
            <p className="text-xs text-stone-500 text-center">PDF generated free via jsPDF — no paid API. WhatsApp opens via wa.me.</p>
          </div>
        </div>
      )}
    </div>
  );
}
