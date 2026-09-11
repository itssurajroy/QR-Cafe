"use client";

import Link from "next/link";
import { paise } from "@/lib/utils";
import {
  CreditCardIcon,
  ClipboardListIcon,
  BookOpenIcon,
  ChairIcon,
  ArrowRightIcon,
  QrCodeIcon,
} from "@/components/Icons";

interface DashboardTabProps {
  liveRevenue: number;
  liveOrders: number;
  itemList: any[];
  tableList: any[];
  recentOrders: any[];
  setTab: any;
  restaurant: any;
}

const STATS = [
  {
    key: "revenue",
    label: "Today's Revenue",
    caption: "Live · refreshes every 30s",
    tile: "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30",
    Icon: CreditCardIcon,
  },
  {
    key: "orders",
    label: "Orders Today",
    caption: "Dine-in, takeaway & delivery",
    tile: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30",
    Icon: ClipboardListIcon,
  },
  {
    key: "items",
    label: "Menu Items",
    caption: "Across all categories",
    tile: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30",
    Icon: BookOpenIcon,
  },
  {
    key: "tables",
    label: "Tables Live",
    caption: "With QR ordering enabled",
    tile: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/30",
    Icon: ChairIcon,
  },
] as const;

export function DashboardTab({ liveRevenue, liveOrders, itemList, tableList, recentOrders, setTab, restaurant }: DashboardTabProps) {
  const values: Record<(typeof STATS)[number]["key"], string> = {
    revenue: paise(liveRevenue),
    orders: String(liveOrders),
    items: String(itemList.length),
    tables: String(tableList.length),
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`w-11 h-11 rounded-2xl ${s.tile} text-white flex items-center justify-center shadow-md`}>
                <s.Icon className="w-5 h-5" />
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-[26px] leading-8 font-black text-slate-900 font-mono tracking-tight">{values[s.key]}</div>
            <div className="text-xs font-bold text-slate-700 mt-1">{s.label}</div>
            <div className="text-[11px] text-slate-400 font-medium">{s.caption}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Recent Orders</h3>
            <p className="text-[11px] text-slate-400 font-medium">Latest activity across all channels</p>
          </div>
          <button
            type="button"
            onClick={() => setTab("analytics")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            View analytics <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="mx-5 mb-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
            <ClipboardListIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-xs font-semibold">No orders today yet</p>
            <p className="text-slate-400 text-[11px] mt-0.5">New orders will appear here live</p>
          </div>
        ) : (
          <div className="px-2 pb-2">
            {recentOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex justify-between items-center gap-3 text-xs px-3 py-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                    {(order.customer_name || "G").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{order.customer_name || "Guest"}</div>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      order.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-slate-900 font-extrabold shrink-0">{paise(order.total_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setTab("menu")}
          className="group bg-white border border-slate-200 rounded-3xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BookOpenIcon className="w-5 h-5" />
            </span>
            <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 block">Manage Menu</span>
          <span className="text-xs text-slate-500 font-medium">{itemList.length} dishes live</span>
        </button>
        <button
          onClick={() => setTab("tables")}
          className="group bg-white border border-slate-200 rounded-3xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-200 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ChairIcon className="w-5 h-5" />
            </span>
            <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 block">Manage Tables</span>
          <span className="text-xs text-slate-500 font-medium">{tableList.length} tables with QRs</span>
        </button>
        <Link
          href={restaurant?.slug ? `/c/${restaurant.slug}` : "/"}
          target="_blank"
          className="group bg-slate-900 border border-slate-900 rounded-3xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <QrCodeIcon className="w-5 h-5" />
            </span>
            <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <span className="text-sm font-extrabold text-white block">View Guest Menu</span>
          <span className="text-xs text-slate-400 font-medium">See exactly what diners see</span>
        </Link>
      </div>
    </div>
  );
}
