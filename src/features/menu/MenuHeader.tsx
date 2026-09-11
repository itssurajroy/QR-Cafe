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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-sm transition-all">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5738F5] flex items-center justify-center text-white shadow-md shadow-[#5738F5]/20 shrink-0 transition-transform active:scale-95">
              <CoffeeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-[#17142B] tracking-tight truncate" style={{ fontFamily: "var(--font-heading)" }}>
                {restaurantName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#EEEAFE] text-[#5738F5] border border-[#5738F5]/20 font-mono"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5738F5] animate-ping" />
                  TABLE {tableLabel.padStart(2, "0")}
                </span>
                <span className="text-xs text-[#6F7185] font-medium">
                  • {t.dineIn}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onHelpClick}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-600 text-xs font-bold border border-slate-200 cursor-pointer touch-manipulation flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <BellIcon className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden sm:inline">Help</span>
            </button>

            <button
              type="button"
              onClick={onVegToggle}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 shadow-sm ${
                vegOnly
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-500/10"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">{t.vegOnly}</span>
              <span className="sm:hidden">Veg</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}