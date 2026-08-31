"use client";

import { SparklesIcon } from "@/components/Icons";
import { paise, getStarRating, getPrepTime, getItemImage } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  inCartQty: number;
  idx: number;
  onAdd: (item: MenuItem) => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onImageClick: (item: MenuItem) => void;
  tAdd: string;
}

export function MenuItemCard({
  item,
  inCartQty,
  idx,
  onAdd,
  onIncrease,
  onDecrease,
  onImageClick,
  tAdd,
}: MenuItemCardProps) {
  const imageUrl = item.image_url || getItemImage(item.name, item.is_veg);
  const stars = getStarRating(item.id);
  const prepTime = getPrepTime(item.name);
  const isFeatured = idx < 3; // First 3 items get Chef's Pick badge

  return (
    <div
      className="bg-white border border-stone-200 hover:border-stone-700/60 rounded-3xl p-3.5 flex gap-3.5 shadow-lg transition-all active:scale-[0.99] group relative backdrop-blur-md animate-fade-in-up"
      style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
    >
      {isFeatured && (
        <div className="absolute -top-2 left-4 px-2 py-1 rounded-full bg-[#D97706] text-white text-[9px] font-black uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
          <span aria-hidden="true"><SparklesIcon className="w-3 h-3" /></span>
          Chef's Pick
        </div>
      )}

      {/* Dish Visual Thumbnail */}
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-stone-50 border border-stone-200 relative cursor-pointer touch-manipulation shadow-md"
        onClick={() => onImageClick(item)}
      >
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <span
          className={`absolute top-2 left-2 w-4 h-4 rounded-md border flex items-center justify-center text-[9px] font-black backdrop-blur-md shadow-md ${
            item.is_veg
              ? "border-emerald-500 bg-emerald-950/80 text-emerald-400"
              : "border-red-500 bg-red-950/80 text-red-400"
          }`}
        >
          ●
        </span>
        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1">
          <span aria-hidden="true">⏱</span> {prepTime}
        </span>
      </div>

      {/* Dish Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight truncate">
            {item.name}
          </h3>

          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-amber-400 text-[11px]">
              {"★".repeat(Math.floor(stars))}
              {"☆".repeat(5 - Math.floor(stars))}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              {stars.toFixed(1)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-extrabold text-[#B45309] text-sm sm:text-base font-mono">
            {paise(item.price_paise)}
          </span>

          <div className="shrink-0">
            {inCartQty === 0 ? (
              <button
                type="button"
                onClick={() => onAdd(item)}
                aria-label={`Add ${item.name} to cart`}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
              >
                <span aria-hidden="true"><SparklesIcon className="w-3.5 h-3.5" /></span>
                <span>{tAdd}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-1.5 py-1 rounded-2xl shadow-inner">
                <button
                  type="button"
                  onClick={() => onDecrease(item.id)}
                  aria-label={`Remove one ${item.name}`}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl bg-white border border-stone-200 hover:bg-stone-50 flex items-center justify-center font-black text-stone-700 text-base cursor-pointer active:scale-90 touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  −
                </button>
                <span className="font-black text-xs text-[#B45309] min-w-5 text-center font-mono">
                  {inCartQty}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrease(item.id)}
                  aria-label={`Add one more ${item.name}`}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl bg-[#D97706] hover:bg-[#B45309] flex items-center justify-center font-black text-white text-base cursor-pointer active:scale-90 touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
