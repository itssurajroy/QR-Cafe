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
}

export function KitchenView({
  liveOrders,
  fetchLiveOrders,
  handleUpdateOrderStatus,
}: KitchenViewProps) {
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
          <p className="text-[11px] text-stone-400">
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
              className="bg-stone-900/90 border border-stone-800 rounded-3xl p-3.5 flex flex-col justify-between overflow-hidden shadow-lg"
            >
              <div className="flex justify-between items-center pb-2.5 mb-2 border-b border-stone-800">
                <span className="font-extrabold text-xs text-white">{col.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${col.color}`}
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
                    onUpdateStatus={handleUpdateOrderStatus}
                  />
                ))}

                {colOrders.length === 0 && (
                  <div className="py-12 text-center text-[11px] text-stone-600">
                    No orders in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
