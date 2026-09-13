// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { paise } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface MenuCustomizationSheetProps {
  item: MenuItem | null;
  onClose: () => void;
  customSpice: string;
  setCustomSpice: (v: string) => void;
  customSize: string;
  setCustomSize: (v: string) => void;
  customNote: string;
  setCustomNote: (v: string) => void;
  onConfirm: () => void;
}

export function MenuCustomizationSheet({
  item,
  onClose,
  customSpice,
  setCustomSpice,
  customSize,
  setCustomSize,
  customNote,
  setCustomNote,
  onConfirm,
}: MenuCustomizationSheetProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 space-y-4 shadow-2xl animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base tracking-tight">
              Customize Dish
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {item.name} • <span className="font-mono text-[#5738F5] font-black">{paise(item.price_paise)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization sheet"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Spice Level */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            🌶️ Spice Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["Mild", "Medium", "Hot", "Extra Hot"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCustomSpice(s)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  customSpice === s
                    ? "bg-red-50 border-red-500 text-red-700 shadow-xs font-black"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Size (only for items > ₹150) */}
        {item.price_paise > 15000 && (
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              📏 Portion Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Half", "Regular", "Large"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setCustomSize(sz)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    customSize === sz
                      ? "bg-violet-50 border-[#5738F5] text-[#5738F5] shadow-xs font-black ring-1 ring-[#5738F5]"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special Notes */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            📝 Special Cooking Instructions
          </label>
          <input
            type="text"
            placeholder="e.g. Less oil, no onions, extra crispy..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            maxLength={100}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-sm cursor-pointer shadow-lg shadow-violet-500/25 active:scale-95 transition-all"
        >
          Add to Table Order • {paise(item.price_paise)}
        </button>
      </div>
    </div>
  );
}
