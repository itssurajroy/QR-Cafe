// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { SparklesIcon } from "@/components/Icons";
import { paise, getItemImage } from "@/lib/utils";
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
  const isFeatured = idx < 3; // First 3 items get Chef's Pick badge

  return (
    <div
      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-3 flex gap-3.5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] group relative animate-fade-in-up"
      style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
    >
      {isFeatured && (
        <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/20 z-10 flex items-center gap-1">
          <span aria-hidden="true"><SparklesIcon className="w-3 h-3" /></span>
          Chef's Pick
        </div>
      )}

      {/* Dish Visual Thumbnail */}
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 relative cursor-pointer touch-manipulation shadow-inner"
        onClick={() => onImageClick(item)}
      >
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-lg text-[10px] font-black backdrop-blur-md shadow-sm border flex items-center gap-1 ${
            item.is_veg
              ? "border-emerald-400/50 bg-emerald-900/80 text-emerald-300"
              : "border-red-400/50 bg-red-900/80 text-red-300"
          }`}
        >
          <span>{item.is_veg ? "🟢 Veg" : "🔴 Non-Veg"}</span>
        </div>
      </div>

      {/* Dish Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-indigo-600 text-sm sm:text-base font-mono">
            {paise(item.price_paise)}
          </span>

          <div className="shrink-0">
            {inCartQty === 0 ? (
              <button
                type="button"
                onClick={() => onAdd(item)}
                aria-label={`Add ${item.name} to cart`}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer flex items-center gap-1.5 touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <span aria-hidden="true"><SparklesIcon className="w-3.5 h-3.5" /></span>
                <span>{tAdd}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-1.5 py-1 rounded-2xl shadow-inner">
                <button
                  type="button"
                  onClick={() => onDecrease(item.id)}
                  aria-label={`Remove one ${item.name}`}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl bg-slate-200 hover:bg-red-100 flex items-center justify-center font-black text-slate-700 text-base cursor-pointer active:scale-90 touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  −
                </button>
                <span className="font-black text-xs text-indigo-600 min-w-5 text-center font-mono">
                  {inCartQty}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrease(item.id)}
                  aria-label={`Add one more ${item.name}`}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl bg-slate-200 hover:bg-indigo-100 flex items-center justify-center font-black text-slate-700 text-base cursor-pointer active:scale-90 touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
