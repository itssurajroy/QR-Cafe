import { paise } from "@/lib/utils";
import type { Category, MenuItem as Item } from "@/types";

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
    <section className="flex-1 flex flex-col bg-stone-950 p-3 sm:p-4 overflow-hidden pb-20 md:pb-4">
      {msg && (
        <div
          className={`p-2 mb-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-lg animate-in fade-in duration-150 ${
            msg.kind === "ok"
              ? "bg-emerald-950 border-emerald-800 text-emerald-300"
              : "bg-red-950 border-red-800 text-red-300"
          }`}
        >
          <span>{msg.kind === "ok" ? "✓" : "⚠️"}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Category scroll on mobile */}
      <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 mb-1 no-scrollbar shrink-0">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            selectedCategory === "all" ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-300"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
              selectedCategory === c.id ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Search & Veg Filter */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            vegOnly
              ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
              : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Veg</span>
        </button>
      </div>

      {/* Grid of Dishes */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 pr-1 pb-16 md:pb-0">
        {filteredItems.map((it) => (
          <div
            key={it.id}
            onClick={() => onAddToCart(it)}
            className="bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/60 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group"
          >
            <div>
              <div className="flex items-start justify-between gap-1 mb-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full border mt-0.5 shrink-0 ${
                    it.is_veg ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                  }`}
                />
                <span className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                  {it.name}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-stone-800/60">
              <span className="text-xs font-mono font-black text-amber-400">
                {paise(it.price_paise)}
              </span>
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-stone-950 text-amber-400 text-xs font-black flex items-center justify-center transition-colors">
                +
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE FLOATING CART ACTION BAR */}
      {cartLength > 0 && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-3 shadow-2xl flex items-center justify-between text-stone-950 font-black animate-in slide-in-from-bottom duration-200">
          <div>
            <div className="text-xs">{totalItemCount} Items Selected</div>
            <div className="text-sm font-mono">{paise(finalTotalPaise)}</div>
          </div>
          <button
            onClick={onOpenMobileCart}
            className="px-4 py-2 bg-stone-950 text-amber-400 rounded-xl text-xs font-black border border-amber-400 shadow-md cursor-pointer"
          >
            View Bill & Settle &rarr;
          </button>
        </div>
      )}
    </section>
  );
}
