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
          className={`w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black rounded-2xl p-4 shadow-2xl shadow-amber-500/40 flex items-center justify-between transition-all active:scale-95 cursor-pointer border border-amber-300/50 touch-manipulation ${
            cartPulse ? "animate-scale-bounce" : "animate-glow-pulse"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-stone-950 text-amber-400 p-1.5 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black uppercase tracking-wider block">
                {tViewCart}
              </span>
              <span className="text-[11px] font-bold opacity-80">
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
