import Link from "next/link";
import type { Category, MenuItem as Item, Table } from "@/types";

interface DashboardTabProps {
  liveRevenue: number;
  liveOrders: number;
  itemList: Item[];
  tableList: Table[];
  recentOrders: any[];
  setTab: (t: any) => void;
  restaurant: any;
}

export function DashboardTab({
  liveRevenue,
  liveOrders,
  itemList,
  tableList,
  recentOrders,
  setTab,
  restaurant,
}: DashboardTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `₹${(liveRevenue / 100).toLocaleString("en-IN")}`, icon: "💰", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Orders Today", value: liveOrders, icon: "🧾", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Menu Items", value: itemList.filter(i => i.available).length, icon: "🍽️", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Active Tables", value: tableList.filter(t => t.active).length, icon: "🪑", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 ${stat.bg} glass-card`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{stat.icon}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
            <p className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-stone-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Real-time Order Feed */}
      <div className="rounded-3xl border border-stone-800 bg-stone-900/80 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <h3 className="font-black text-white text-sm" style={{ fontFamily: "var(--font-heading)" }}>Live Order Feed</h3>
            <span className="text-[10px] text-stone-500">Auto-refreshes every 30s</span>
          </div>
          <button
            type="button"
            onClick={() => setTab("report")}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            View Full Report →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm font-bold">No recent orders yet</p>
            <p className="text-xs mt-1">Orders placed by customers will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800">
                <div>
                  <p className="text-xs font-bold text-stone-200">
                    Table {o.table_label} <span className="text-stone-500 font-normal">({o.customer_name})</span>
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {o.items?.length || 0} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-amber-400">
                    ₹{(o.total_paise / 100).toFixed(2)}
                  </p>
                  <p className={`text-[9px] uppercase font-black ${o.payment_status === "paid" ? "text-emerald-400" : "text-stone-500"}`}>
                    {o.payment_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
