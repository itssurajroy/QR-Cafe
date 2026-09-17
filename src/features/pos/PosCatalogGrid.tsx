// Copyright (c) 2026 QRslice. All rights reserved.
import { paise } from "@/lib/utils";
import type { Category, MenuItem as Item } from "@/types";
import { SearchIcon, PlusIcon } from "@/components/Icons";

interface PosCatalogGridProps {
  categories: Category[];
  items: Item[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  vegOnly: boolean;
  setVegOnly: (val: boolean) => void;
  onAddToCart: (item: Item) => void;
  msg: { kind: "ok" | "err"; text: string } | null;
  totalItemCount: number;
  finalTotalPaise: number;
  onOpenMobileCart: () => void;
  cartLength: number;
}

export function PosCatalogGrid({
  categories,
  items,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  vegOnly,
  setVegOnly,
  onAddToCart,
  msg,
  totalItemCount,
  finalTotalPaise,
  onOpenMobileCart,
  cartLength,
}: PosCatalogGridProps) {
  const filteredItems = items
    .filter((i) => {
      const matchesCat = selectedCategory === "all" || i.category_id === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesVeg = !vegOnly || i.is_veg;
      return matchesCat && matchesSearch && matchesVeg;
    })
    .sort((a, b) => {
      // In-stock items first, followed by sold-out items
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  const soldOutCount = filteredItems.filter((i) => !i.available).length;

  return (
    <section className="flex-1 flex flex-col bg-[#F5F5F7] p-3 sm:p-4 overflow-hidden pb-20 md:pb-4 border-r border-black/[0.06]">
      {msg && (
        <div
          className={`p-3 mb-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border shadow-xs animate-in fade-in duration-200 ${
            msg.kind === "ok"
              ? "bg-[#34C759]/10 border-[#34C759]/25 text-[#34C759]"
              : "bg-[#FF3B30]/10 border-[#FF3B30]/25 text-[#FF3B30]"
          }`}
        >
          <span className="font-bold text-sm">{msg.kind === "ok" ? "✓" : "⚠️"}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Category scroll on mobile */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-1 no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 min-h-[40px] ${
            selectedCategory === "all"
              ? "bg-slate-900 text-white shadow-xs font-bold"
              : "bg-white border border-black/[0.06] text-slate-700 hover:text-slate-900"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 min-h-[40px] ${
              selectedCategory === c.id
                ? "bg-slate-900 text-white shadow-xs font-bold"
                : "bg-white border border-black/[0.06] text-slate-700 hover:text-slate-900"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Search & Veg Filter */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="flex-1 relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            id="pos-search-input"
            type="text"
            placeholder="Search menu items (F2)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black/[0.06] rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15 min-h-[44px] transition-all shadow-xs font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 text-xs cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setVegOnly(!vegOnly)}
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 min-h-[44px] ${
            vegOnly
              ? "bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759] shadow-xs font-bold"
              : "bg-white border-black/[0.06] text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-xs shadow-[#34C759]/80 animate-pulse"></span>
          <span>Veg</span>
        </button>
      </div>

      {soldOutCount > 0 && !searchQuery && (
        <div className="mb-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-white/70 border border-black/[0.04] rounded-xl px-3 py-1.5">
          <span>{soldOutCount} item{soldOutCount === 1 ? "" : "s"} marked out of stock by kitchen</span>
          <span className="font-mono text-[10px] text-rose-600 font-bold uppercase">Sold Out Visible</span>
        </div>
      )}

      {/* Grid of Dishes */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 pr-1 pb-16 md:pb-0 content-start">
        {filteredItems.map((it) => {
          const isSoldOut = !it.available;
          return (
            <div
              key={it.id}
              onClick={() => {
                if (!isSoldOut) {
                  onAddToCart(it);
                }
              }}
              className={`rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 shadow-xs border ${
                isSoldOut
                  ? "bg-slate-100/80 border-slate-200 opacity-65 cursor-not-allowed select-none"
                  : "bg-white hover:bg-slate-50/80 border-black/[0.06] hover:border-[#007AFF]/40 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-md group"
              } min-h-[114px]`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full border mt-1 shrink-0 ${
                      it.is_veg ? "border-[#34C759] bg-[#34C759]" : "border-[#FF3B30] bg-[#FF3B30]"
                    }`}
                  />
                  <span
                    className={`font-semibold text-xs line-clamp-2 leading-snug transition-colors ${
                      isSoldOut
                        ? "text-slate-500 line-through decoration-slate-300"
                        : "text-slate-900 group-hover:text-[#007AFF]"
                    }`}
                  >
                    {it.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/[0.04]">
                <span className="text-xs font-mono font-bold text-slate-900 tracking-tight">
                  {paise(it.price_paise)}
                </span>
                {isSoldOut ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                    SOLD OUT
                  </span>
                ) : (
                  <span className="w-7 h-7 rounded-full bg-[#007AFF]/10 group-hover:bg-[#007AFF] group-hover:text-white text-[#007AFF] text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-xs">
                    <PlusIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE FLOATING CART ACTION BAR */}
      {cartLength > 0 && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 bg-[#007AFF] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between font-bold animate-in slide-in-from-bottom duration-200">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{totalItemCount} Items Selected</div>
            <div className="text-sm font-mono font-bold">{paise(finalTotalPaise)}</div>
          </div>
          <button
            type="button"
            onClick={onOpenMobileCart}
            className="px-4 py-2 bg-white text-[#007AFF] rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-transform min-h-[40px]"
          >
            View Bill & Settle &rarr;
          </button>
        </div>
      )}
    </section>
  );
}
