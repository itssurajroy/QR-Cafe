"use client";

import { SearchIcon, FlameIcon, UtensilsIcon, SparklesIcon, CoffeeIcon } from "@/components/Icons";
import type { Category } from "@/types";

function CategoryIcon({ name, className = "w-3.5 h-3.5" }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes("dessert") || n.includes("sweet") || n.includes("cake")) return <SparklesIcon className={className} />;
  if (n.includes("beverage") || n.includes("drink") || n.includes("coffee") || n.includes("tea")) return <CoffeeIcon className={className} />;
  return <UtensilsIcon className={className} />;
}

interface MenuCategoryFilterProps {
  categories: Category[];
  search: string;
  onSearchChange: (val: string) => void;
  activeCat: string;
  onCatChange: (id: string) => void;
  tSearch: string;
  tAll: string;
}

export function MenuCategoryFilter({
  categories,
  search,
  onSearchChange,
  activeCat,
  onCatChange,
  tSearch,
  tAll,
}: MenuCategoryFilterProps) {
  return (
    <>
      {/* Search bar */}
      <div className="mt-3 relative">
        <input
          type="text"
          placeholder={tSearch}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search menu"
          className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 pl-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all shadow-sm min-h-[44px]"
        />
        <div className="absolute left-3.5 top-3.5 text-stone-500 pointer-events-none" aria-hidden="true">
          <SearchIcon className="w-4 h-4" />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-3 top-2.5 text-stone-600 hover:text-stone-900 text-xs bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Horizontal Scrolling Tabs */}
      {!search && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => onCatChange("all")}
            aria-pressed={activeCat === "all"}
            className={`px-4 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 ${
              activeCat === "all"
                ? "bg-[#D97706] text-white shadow-md font-black"
                : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
            }`}
          >
            <span aria-hidden="true"><FlameIcon className="w-3.5 h-3.5" /></span>
            <span>{tAll}</span>
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => onCatChange(c.id)}
              aria-pressed={c.id === activeCat}
              className={`px-4 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 ${
                c.id === activeCat
                  ? "bg-[#D97706] text-white shadow-md font-black"
                  : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              <span aria-hidden="true"><CategoryIcon name={c.name} /></span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
