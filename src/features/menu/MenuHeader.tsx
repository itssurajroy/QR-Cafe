// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { CoffeeIcon, BellIcon } from "@/components/Icons";

interface MenuHeaderProps {
  restaurantName: string;
  tableLabel: string;
  onHelpClick: () => void;
  vegOnly: boolean;
  onVegToggle: () => void;
  t: Record<string, string>;
}

export function MenuHeader({
  restaurantName,
  tableLabel,
  onHelpClick,
  vegOnly,
  onVegToggle,
  t,
}: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Table Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#5738F5] to-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-violet-500/20 shrink-0 transition-transform active:scale-95">
            <CoffeeIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                {restaurantName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Order
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-violet-50 text-[#5738F5] border border-violet-200/80 font-mono shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5738F5] animate-pulse" />
                TABLE {tableLabel}
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                Dine-In Menu
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Table Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onHelpClick}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-[#5738F5] text-xs font-black border border-violet-200 cursor-pointer touch-manipulation flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <BellIcon className="w-3.5 h-3.5 text-[#5738F5]" />
            <span className="hidden sm:inline">Call Waiter</span>
            <span className="sm:hidden">Help</span>
          </button>

          <button
            type="button"
            onClick={onVegToggle}
            aria-pressed={vegOnly}
            className={`flex items-center gap-1.5 text-xs px-3 sm:px-3.5 py-2 rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 shadow-sm ${
              vegOnly
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black shadow-emerald-500/10"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${vegOnly ? "bg-emerald-600 animate-pulse" : "bg-emerald-500"}`} />
            <span className="hidden sm:inline">{t.vegOnly}</span>
            <span className="sm:hidden">Veg</span>
          </button>
        </div>
      </div>
    </header>
  );
}
