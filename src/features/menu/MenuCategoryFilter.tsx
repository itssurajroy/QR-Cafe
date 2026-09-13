// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { SearchIcon, FlameIcon, UtensilsIcon, SparklesIcon, CoffeeIcon, ZapIcon } from "@/components/Icons";
import type { Category } from "@/types";

function CategoryIcon({ name, className = "w-3.5 h-3.5" }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes("dessert") || n.includes("sweet") || n.includes("cake")) return <SparklesIcon className={className} />;
  if (n.includes("beverage") || n.includes("drink") || n.includes("coffee") || n.includes("tea") || n.includes("shake")) return <CoffeeIcon className={className} />;
  if (n.includes("biryani") || n.includes("rice") || n.includes("bread") || n.includes("roti") || n.includes("naan")) return <FlameIcon className={className} />;
  return <UtensilsIcon className={className} />;
}

interface MenuCategoryFilterProps {
  categories: Category[];
  search: string;
  onSearchChange: (val: string) => void;
  activeCat: string;
  onCatChange: (id: string) => void;
  categoryCounts?: Record<string, number>;
  totalCount?: number;
  dietaryFilter?: "all" | "veg" | "non-veg" | "fast";
  onDietaryChange?: (filter: "all" | "veg" | "non-veg" | "fast") => void;
  tSearch: string;
  tAll: string;
}

export function MenuCategoryFilter({
  categories,
  search,
  onSearchChange,
  activeCat,
  onCatChange,
  categoryCounts = {},
  totalCount,
  dietaryFilter = "all",
  onDietaryChange,
  tSearch,
  tAll,
}: MenuCategoryFilterProps) {
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={tSearch}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search menu"
          className="w-full bg-white border border-slate-200/90 rounded-2xl px-4 py-3 pl-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]"
        />
        <div className="absolute left-4 top-3.5 text-slate-400 pointer-events-none">
          <SearchIcon className="w-4 h-4" />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 text-xs font-black bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Horizontal Scrolling Navigation */}
      {!search && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {/* All Category */}
          <button
            type="button"
            onClick={() => onCatChange("all")}
            aria-pressed={activeCat === "all"}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95 border shrink-0 ${
              activeCat === "all"
                ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white border-[#5738F5] shadow-md shadow-violet-500/20"
                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-sm"
            }`}
          >
            <FlameIcon className="w-3.5 h-3.5" />
            <span>{tAll}</span>
            {totalCount !== undefined && totalCount > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeCat === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {totalCount}
              </span>
            )}
          </button>

          {/* Dynamic Categories */}
          {categories.map((c) => {
            const count = categoryCounts[c.id];
            const isSelected = c.id === activeCat;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => onCatChange(c.id)}
                aria-pressed={isSelected}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95 border shrink-0 ${
                  isSelected
                    ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white border-[#5738F5] shadow-md shadow-violet-500/20"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-sm"
                }`}
              >
                <CategoryIcon name={c.name} />
                <span>{c.name}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Dietary & Speed Filter Chips */}
      {onDietaryChange && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => onDietaryChange("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
              dietaryFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            All Diets
          </button>
          <button
            type="button"
            onClick={() => onDietaryChange(dietaryFilter === "veg" ? "all" : "veg")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dietaryFilter === "veg"
                ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-black shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pure Veg</span>
          </button>
          <button
            type="button"
            onClick={() => onDietaryChange(dietaryFilter === "non-veg" ? "all" : "non-veg")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dietaryFilter === "non-veg"
                ? "bg-red-50 border-red-400 text-red-800 font-black shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Non-Veg</span>
          </button>
          <button
            type="button"
            onClick={() => onDietaryChange(dietaryFilter === "fast" ? "all" : "fast")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dietaryFilter === "fast"
                ? "bg-amber-50 border-amber-400 text-amber-900 font-black shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <ZapIcon className="w-3 h-3 text-amber-500" />
            <span>Quick Bites (&le;15m)</span>
          </button>
        </div>
      )}
    </div>
  );
}
