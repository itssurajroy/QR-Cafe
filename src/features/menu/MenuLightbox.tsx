// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { paise, getPrepTime, getItemImage } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface MenuLightboxProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddClick: (item: MenuItem) => void;
  tAdd: string;
}

export function MenuLightbox({
  item,
  onClose,
  onAddClick,
  tAdd,
}: MenuLightboxProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={item.image_url || getItemImage(item.name, item.is_veg)}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-md text-[10px] font-black border border-slate-200 shadow-sm flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={item.is_veg ? "text-emerald-700" : "text-red-700"}>
              {item.is_veg ? "Veg" : "Non-Veg"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className="text-lg font-black text-slate-900 leading-snug"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {item.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">
                  ⏱ {getPrepTime(item.name)}
                </span>
              </div>
            </div>
            <span className="text-lg font-black text-[#5738F5] font-mono shrink-0">
              {paise(item.price_paise)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onAddClick(item)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs cursor-pointer shadow-md shadow-violet-500/25 transition-all"
            >
              {tAdd} to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
