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
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-xl border-b border-stone-800/80 px-4 py-3 shadow-xl transition-all">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/25 shrink-0 transition-transform active:scale-95">
              <CoffeeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {restaurantName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  Table {tableLabel}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  • {t.dineIn}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onHelpClick}
              className="px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-amber-400 text-xs font-black border border-stone-700/80 cursor-pointer touch-manipulation flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <BellIcon className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden sm:inline">Help</span>
            </button>

            <button
              type="button"
              onClick={onVegToggle}
              className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer touch-manipulation active:scale-95 shadow-sm ${
                vegOnly
                  ? "bg-emerald-950/90 border-emerald-600 text-emerald-400 shadow-emerald-950/50"
                  : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline">{t.vegOnly}</span>
              <span className="sm:hidden">Veg</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
