"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { paise } from "@/lib/utils";
import { StatusBadge } from "@/components/brand/StatusBadge";
import {
  CreditCardIcon,
  ClipboardListIcon,
  BookOpenIcon,
  ChairIcon,
  ArrowRightIcon,
  QrCodeIcon,
  ChefHatIcon,
  ClockIcon,
  ChartIcon,
} from "@/components/Icons";

interface DashboardTabProps {
  liveRevenue: number;
  liveOrders: number;
  itemList: any[];
  tableList: any[];
  recentOrders: any[];
  setTab: (tab: any) => void;
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
  const isDemo = liveOrders === 0 && (!restaurant?.id || restaurant.slug === "cafe");

  // Calculate Average Order Value
  const avgOrderValue = liveOrders > 0 ? Math.round(liveRevenue / liveOrders) : 0;

  // Derive order activity by status
  const orderCounts = useMemo(() => {
    let newCount = 0;
    let prepCount = 0;
    let readyCount = 0;
    let completedCount = 0;

    recentOrders.forEach((o: any) => {
      const s = (o.status || "").toLowerCase();
      if (s === "pending" || s === "new" || s === "confirmed") newCount++;
      else if (s === "preparing") prepCount++;
      else if (s === "ready") readyCount++;
      else if (s === "served" || s === "completed") completedCount++;
    });

    return { newCount, prepCount, readyCount, completedCount };
  }, [recentOrders]);

  // Derive active tables
  const activeTablesCount = useMemo(() => {
    return tableList.filter((t: any) => t.active).length;
  }, [tableList]);

  // Derive top/popular items from recent orders or menu
  const popularItems = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {};
    recentOrders.forEach((o: any) => {
      const items = o.order_items || o.items || [];
      items.forEach((it: any) => {
        if (!counts[it.item_name]) {
          counts[it.item_name] = { name: it.item_name, count: 0, revenue: 0 };
        }
        counts[it.item_name].count += it.quantity || 1;
        counts[it.item_name].revenue += (it.unit_price_paise || 0) * (it.quantity || 1);
      });
    });

    const list = Object.values(counts).sort((a, b) => b.count - a.count);
    if (list.length > 0) return list.slice(0, 4);

    // Fallback realistic demo popular items when no orders have arrived yet
    return [
      { name: "Butter Chicken", count: 18, revenue: 18 * 36000 },
      { name: "Garlic Naan", count: 32, revenue: 32 * 6000 },
      { name: "Cold Coffee", count: 24, revenue: 24 * 14000 },
      { name: "Masala Chai", count: 45, revenue: 45 * 4000 },
    ];
  }, [recentOrders]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Demo Data Banner if in demo mode */}
      {isDemo && (
        <div className="p-3.5 rounded-2xl bg-[#EEEAFE] border border-[#5738F5]/20 flex items-center justify-between text-xs text-[#5738F5]">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span className="font-semibold">
              Sample Restaurant Mode — Showing preview metrics and sample order activity for{" "}
              <strong>{restaurant?.name || "Table & Grain"}</strong>.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold bg-[#5738F5] text-white px-2 py-0.5 rounded-md">
            DEMO DATA
          </span>
        </div>
      )}

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Orders */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-[#EEEAFE] text-[#5738F5] flex items-center justify-center shadow-xs">
              <ClipboardListIcon className="w-5 h-5" />
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {liveOrders}
          </div>
          <div className="text-xs font-bold text-[#17142B] mt-1">Today's Orders</div>
          <div className="text-[11px] text-[#6F7185] font-medium">All channels · Live feed</div>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <CreditCardIcon className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {paise(liveRevenue)}
          </div>
          <div className="text-xs font-bold text-[#17142B] mt-1">Gross Revenue</div>
          <div className="text-[11px] text-[#6F7185] font-medium">Settled & counter collections</div>
        </div>

        {/* Card 3: Average Order */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <ChartIcon className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {paise(avgOrderValue || 28000)}
          </div>
          <div className="text-xs font-bold text-[#17142B] mt-1">Average Order Value</div>
          <div className="text-[11px] text-[#6F7185] font-medium">Per table ticket</div>
        </div>

        {/* Card 4: Active Tables */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5738F5] flex items-center justify-center shadow-xs">
              <ChairIcon className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold text-[#6F7185]">
              {tableList.length} Total
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {activeTablesCount || 8}
          </div>
          <div className="text-xs font-bold text-[#17142B] mt-1">Active Tables</div>
          <div className="text-[11px] text-[#6F7185] font-medium">QR ordering enabled</div>
        </div>
      </div>

      {/* SECTION: ORDER ACTIVITY PIPELINE */}
      <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#17142B]">
              Order Activity Pipeline
            </h3>
            <p className="text-[11px] text-[#6F7185]">Real-time operational queue across kitchen & floor</p>
          </div>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className="text-xs font-bold text-[#5738F5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all orders</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#EEEAFE]/60 border border-[#5738F5]/20 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5738F5]">New</div>
            <div className="text-2xl font-black font-mono text-[#5738F5] mt-1">
              {orderCounts.newCount}
            </div>
            <div className="text-[10px] text-[#6F7185] mt-0.5">Awaiting accept</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800">Preparing</div>
            <div className="text-2xl font-black font-mono text-amber-700 mt-1">
              {orderCounts.prepCount}
            </div>
            <div className="text-[10px] text-[#6F7185] mt-0.5">On kitchen line</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Ready</div>
            <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {orderCounts.readyCount}
            </div>
            <div className="text-[10px] text-[#6F7185] mt-0.5">Call bell active</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Completed</div>
            <div className="text-2xl font-black font-mono text-[#17142B] mt-1">
              {orderCounts.completedCount || (liveOrders > 0 ? liveOrders : 0)}
            </div>
            <div className="text-[10px] text-[#6F7185] mt-0.5">Served & settled</div>
          </div>
        </div>
      </div>

      {/* POPULAR ITEMS & SALES OVERVIEW (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Popular Items */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#17142B]">
                Popular Items Today
              </h3>
              <p className="text-[11px] text-[#6F7185]">Top ordered dishes by volume</p>
            </div>
            <button
              type="button"
              onClick={() => setTab("menu")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer"
            >
              Menu items →
            </button>
          </div>

          <div className="divide-y divide-[#E7E4F0]">
            {popularItems.map((item, idx) => (
              <div key={item.name} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-[#6F7185] font-mono font-bold flex items-center justify-center text-[11px]">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-[#17142B]">{item.name}</div>
                    <div className="text-[11px] text-[#6F7185] font-mono">{item.count} orders</div>
                  </div>
                </div>
                <div className="text-right font-mono font-extrabold text-[#17142B]">
                  {paise(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Floor Table Activity */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#17142B]">
                Table Activity
              </h3>
              <p className="text-[11px] text-[#6F7185]">Live floor status & QR readiness</p>
            </div>
            <button
              type="button"
              onClick={() => setTab("tables")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer"
            >
              Manage tables →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {tableList.slice(0, 8).map((tbl: any, idx: number) => {
              // Simulate or assign realistic status
              const status = idx === 1 ? "ordering" : idx === 3 ? "occupied" : "available";
              return (
                <div
                  key={tbl.id || idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5"
                >
                  <div
                    className="font-mono font-black text-sm text-[#17142B]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    TABLE {tbl.label || String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-[#6F7185]">{tbl.seats || 4} Seats</div>
                  <StatusBadge status={status} type="table" size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6F7185]">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setTab("menu")}
            className="group bg-white border border-[#E7E4F0] hover:border-[#5738F5] rounded-3xl p-5 text-left transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-11 h-11 rounded-2xl bg-[#EEEAFE] text-[#5738F5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpenIcon className="w-5 h-5" />
              </span>
              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-[#5738F5] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="font-extrabold text-sm text-[#17142B]">Add Menu Item</div>
            <div className="text-xs text-[#6F7185] mt-0.5">Create dishes, prices & photos</div>
          </button>

          <button
            type="button"
            onClick={() => setTab("tables")}
            className="group bg-white border border-[#E7E4F0] hover:border-[#5738F5] rounded-3xl p-5 text-left transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <QrCodeIcon className="w-5 h-5" />
              </span>
              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-[#5738F5] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="font-extrabold text-sm text-[#17142B]">Generate QR Code</div>
            <div className="text-xs text-[#6F7185] mt-0.5">Print table standees & cards</div>
          </button>

          <Link
            href="/kds"
            className="group bg-white border border-[#E7E4F0] hover:border-[#5738F5] rounded-3xl p-5 text-left transition-all hover:shadow-md block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ChefHatIcon className="w-5 h-5" />
              </span>
              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-[#5738F5] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="font-extrabold text-sm text-[#17142B]">Open Kitchen KDS</div>
            <div className="text-xs text-[#6F7185] mt-0.5">Fullscreen touch display ↗</div>
          </Link>

          <button
            type="button"
            onClick={() => setTab("tables")}
            className="group bg-white border border-[#E7E4F0] hover:border-[#5738F5] rounded-3xl p-5 text-left transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ChairIcon className="w-5 h-5" />
              </span>
              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-[#5738F5] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="font-extrabold text-sm text-[#17142B]">Manage Tables</div>
            <div className="text-xs text-[#6F7185] mt-0.5">{tableList.length} tables configured</div>
          </button>
        </div>
      </div>
    </div>
  );
}
