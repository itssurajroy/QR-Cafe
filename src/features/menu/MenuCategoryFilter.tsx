"use client";

import { SearchIcon } from "@/components/Icons";
import { getCategoryEmoji } from "@/lib/utils";
import type { Category } from "@/types";

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
          className="w-full bg-stone-50/90 border border-stone-200 rounded-2xl px-4 py-2.5 pl-10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
        />
        <div className="absolute left-3.5 top-3 text-stone-500 pointer-events-none">
          <SearchIcon className="w-4 h-4" />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-900 text-xs bg-stone-800 px-2 py-0.5 rounded-lg cursor-pointer"
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
              activeCat === "all"
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-md shadow-amber-500/30 font-black"
                : "bg-white text-stone-600 hover:bg-stone-800 border border-stone-200"
            }`}
          >
            <span>🔥</span>
            <span>{tAll}</span>
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => onCatChange(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
                c.id === activeCat
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-md shadow-amber-500/30 font-black"
                  : "bg-white text-stone-600 hover:bg-stone-800 border border-stone-200"
              }`}
            >
              <span>{getCategoryEmoji(c.name)}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
