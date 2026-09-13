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
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-4 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.image_url || getItemImage(item.name, item.is_veg)}
          alt={item.name}
          className="w-full rounded-3xl object-cover shadow-2xl border border-slate-200"
          style={{ maxHeight: "60vh" }}
        />
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3
                className="text-lg font-black text-slate-900"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {item.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-3 h-3 rounded-sm border-2 ${
                    item.is_veg
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-red-500 bg-red-50"
                  }`}
                ></span>
                <span className="text-xs text-slate-600">
                  {item.is_veg ? "Pure Veg" : "Non-Veg"}
                </span>
                <span className="text-xs text-slate-500">
                  • ⏱ {getPrepTime(item.name)}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            <span className="text-xl font-black text-indigo-600 font-mono">
              {paise(item.price_paise)}
            </span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onAddClick(item)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-sm cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {tAdd} to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
