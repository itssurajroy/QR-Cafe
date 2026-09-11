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
          className={`w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-black rounded-2xl p-4 shadow-2xl shadow-indigo-600/40 flex items-center justify-between transition-all active:scale-95 cursor-pointer border border-indigo-300/50 touch-manipulation ${
            cartPulse ? "animate-scale-bounce" : "animate-glow-pulse"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="bg-white/20 text-white p-1.5 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black uppercase tracking-wider block">
                {tViewCart}
              </span>
              <span className="text-xs font-bold opacity-80">
                {totalQty} items selected
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