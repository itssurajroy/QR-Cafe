// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { MapPinIcon, ShoppingBagIcon } from "@/components/Icons";
import { paise } from "@/lib/utils";

interface MenuFloatingCartButtonProps {
  totalQty: number;
  totalPaise: number;
  cartPulse: boolean;
  onOpenCart: () => void;
  tViewCart: string;
  tableLabel?: string;
}

export function MenuFloatingCartButton({
  totalQty,
  totalPaise,
  cartPulse,
  onOpenCart,
  tViewCart,
  tableLabel,
}: MenuFloatingCartButtonProps) {
  if (totalQty === 0) return null;

  return (
    <aside
      aria-label="Order Cart Bar"
      className={`fixed bottom-5 left-4 right-4 z-40 max-w-2xl mx-auto animate-fade-in-up transition-transform duration-300 ${
        cartPulse ? "scale-[1.02]" : "scale-100"
      }`}
    >
      <div className="bg-white text-slate-900 p-3 sm:p-3.5 rounded-2xl shadow-[0_12px_40px_-6px_rgba(0,0,0,0.16)] flex items-center justify-between border border-slate-200/90 gap-3">
        {/* Left: Cart Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5738F5] to-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-md shadow-violet-500/25 shrink-0">
            <ShoppingBagIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black flex items-center gap-2 text-slate-900 font-mono">
              <span>{paise(totalPaise)}</span>
              <span className="text-slate-400 font-sans font-medium text-xs">
                ({totalQty} {totalQty === 1 ? "item" : "items"})
              </span>
            </div>
            <div className="text-[11px] text-[#5738F5] font-bold flex items-center gap-1">
              <MapPinIcon className="w-3 h-3 text-[#5738F5]" />
              <span className="truncate">
                {tableLabel ? `Table ${tableLabel}` : "Dine-In"} • Ready to Send
              </span>
            </div>
          </div>
        </div>

        {/* Right: Checkout CTA */}
        <button
          type="button"
          onClick={onOpenCart}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-violet-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>{tViewCart || "View Cart"}</span>
          <span>→</span>
        </button>
      </div>
    </aside>
  );
}
