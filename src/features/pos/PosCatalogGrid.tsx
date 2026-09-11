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
  const filteredItems = items.filter((i) => {
    const matchesCat = selectedCategory === "all" || i.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !vegOnly || i.is_veg;
    return i.available && matchesCat && matchesSearch && matchesVeg;
  });

  return (
    <section className="flex-1 flex flex-col bg-slate-100 p-3 sm:p-4 overflow-hidden pb-20 md:pb-4 border-r border-slate-200">
      {msg && (
        <div
          className={`p-3 mb-3 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-sm animate-in fade-in duration-200 ${
            msg.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="font-extrabold text-sm">{msg.kind === "ok" ? "✓" : "⚠️"}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Category scroll on mobile */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2.5 mb-1 no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 min-h-[44px] ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white shadow-md font-black"
              : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 min-h-[44px] ${
              selectedCategory === c.id
                ? "bg-indigo-600 text-white shadow-md font-black"
                : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900"
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
            type="text"
            placeholder="Search dishes (F2)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] transition-all shadow-sm"
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
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 min-h-[44px] ${
            vegOnly
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80 animate-pulse"></span>
          <span>Veg</span>
        </button>
      </div>

      {/* Grid of Dishes */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 pr-1 pb-16 md:pb-0">
        {filteredItems.map((it) => (
          <div
            key={it.id}
            onClick={() => onAddToCart(it)}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md group min-h-[110px]"
          >
            <div>
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full border mt-1 shrink-0 ${
                    it.is_veg ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                  }`}
                />
                <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                  {it.name}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-mono font-black text-indigo-600 tracking-tight">
                {paise(it.price_paise)}
              </span>
              <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 text-xs font-black flex items-center justify-center transition-all duration-200 shadow-sm">
                <PlusIcon className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE FLOATING CART ACTION BAR */}
      {cartLength > 0 && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 bg-indigo-600 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between font-black animate-in slide-in-from-bottom duration-200">
          <div>
            <div className="text-xs uppercase tracking-wider">{totalItemCount} Items Selected</div>
            <div className="text-sm font-mono">{paise(finalTotalPaise)}</div>
          </div>
          <button
            type="button"
            onClick={onOpenMobileCart}
            className="px-4 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-md cursor-pointer active:scale-95 transition-transform min-h-[44px]"
          >
            View Bill & Settle &rarr;
          </button>
        </div>
      )}
    </section>
  );
}