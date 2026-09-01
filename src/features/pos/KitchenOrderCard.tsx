type OrderRow = {
  id: string;
  table_label: string;
  order_number: string;
  payment_status: string;
  created_at: string;
  status: string;
  items: any[];
};

interface KitchenOrderCardProps {
  order: OrderRow;
  nextStatus: string;
  nextLabel: string;
  onUpdateStatus: (
    id: string,
    status: string,
    orderNumber: string,
    tableLabel: string
  ) => void;
}

export function KitchenOrderCard({
  order,
  nextStatus,
  nextLabel,
  onUpdateStatus,
}: KitchenOrderCardProps) {
  return (
    <div className="bg-stone-950 border border-stone-800/90 rounded-2xl p-3 space-y-2.5 shadow-md flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-stone-800/80 pb-2">
          <div>
            <span className="font-black text-sm text-white block">
              Table {order.table_label}
            </span>
            <span className="text-xs font-mono text-stone-500">
              #{order.order_number} •{" "}
              {new Date(order.created_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1 border ${
              order.payment_status === "paid"
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-red-500 text-white border-red-600 animate-pulse"
            }`}
          >
            {order.payment_status === "paid" ? "✓ PAID" : "⚠️ UNPAID"}
          </span>
        </div>
        <div className={`mt-2 p-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${order.payment_status === "paid" ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-red-950/40 border-red-800 text-red-300"}`}>
          <span>{order.payment_status === "paid" ? "✓" : "⚠️"}</span>
          <span>{order.payment_status === "paid" ? "Payment Received — Serve & close" : "Payment Pending — Collect at counter before serve"}</span>
        </div>

        {/* Items List */}
        <div className="space-y-1.5 py-2 text-xs">
          {order.items.map((it: any) => (
            <div key={it.id} className="flex justify-between text-stone-200">
              <div className="flex flex-col">
                <span>{it.item_name}</span>
                {(it.spice_level || it.size_variant || it.notes) && (
                  <span className="text-xs text-stone-400">
                    {[it.spice_level, it.size_variant, it.notes].filter(Boolean).join(" • ")}
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">
                ×{it.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onUpdateStatus(order.id, nextStatus, order.order_number, order.table_label)
        }
        className="w-full py-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 font-black text-xs transition-all border border-stone-700 cursor-pointer shadow-md"
      >
        {nextLabel}
      </button>
    </div>
  );
}
