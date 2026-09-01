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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="font-black text-white text-base"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Customize Order
            </h3>
            <p className="text-xs text-stone-400">
              {item.name} • {paise(item.price_paise)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Spice Level */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
            🌶️ Spice Level
          </label>
          <div className="flex gap-2">
            {["Mild", "Medium", "Hot", "Extra Hot"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCustomSpice(s)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  customSpice === s
                    ? "bg-red-950 border-red-500 text-red-300"
                    : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
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
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
              📏 Portion Size
            </label>
            <div className="flex gap-2">
              {["Half", "Regular", "Large"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setCustomSize(sz)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    customSize === sz
                      ? "bg-amber-950 border-amber-500 text-amber-300"
                      : "bg-stone-950 border-stone-800 text-stone-400"
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
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
            📝 Special Instructions
          </label>
          <input
            type="text"
            placeholder="e.g. No onions, extra cheese, less oil..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            maxLength={100}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-sm cursor-pointer shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
        >
          + Add to Cart • {paise(item.price_paise)}
        </button>
      </div>
    </div>
  );
}
