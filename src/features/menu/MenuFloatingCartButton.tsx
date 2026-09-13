// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { ShoppingBagIcon } from "@/components/Icons";
import { paise } from "@/lib/utils";

interface MenuFloatingCartButtonProps {
  totalQty: number;
  totalPaise: number;
  cartPulse: boolean;
  onOpenCart: () => void;
  tViewCart: string;
}

export function MenuFloatingCartButton({
  totalQty,
  totalPaise,
  cartPulse,
  onOpenCart,
  tViewCart,
}: MenuFloatingCartButtonProps) {
  if (totalQty === 0) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-3 pointer-events-auto">
      <div className="max-w-xl mx-auto">
        <button
          type="button"
          onClick={onOpenCart}
          className={`w-full bg-gradient-to-r from-[#5738F5] to-[#4328D9] hover:from-[#4328D9] hover:to-[#5738F5] text-white font-black rounded-2xl p-4 shadow-xl shadow-[#5738F5]/30 flex items-center justify-between transition-all active:scale-95 cursor-pointer touch-manipulation ${
            cartPulse ? "animate-scale-bounce" : "animate-glow-pulse"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 text-white p-2 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black uppercase tracking-wider block">
                Review Order · {totalQty} {totalQty === 1 ? "item" : "items"}
              </span>
              <span className="text-[11px] text-white/80 font-medium">
                Tap to customize or checkout
              </span>
            </div>
          </div>
          <span className="text-base font-black font-mono">
            {paise(totalPaise)} &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}
