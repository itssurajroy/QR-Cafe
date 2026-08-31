"use client";

import { BellIcon, CheckCircleIcon, DropletIcon, SparklesIcon } from "@/components/Icons";

interface MenuServiceModalProps {
  serviceModal: boolean;
  onClose: () => void;
  tableLabel: string;
  serviceMsg: string | null;
  onRequest: (type: "waiter" | "water" | "clean") => void;
  t: Record<string, string>;
}

export function MenuServiceModal({
  serviceModal,
  onClose,
  tableLabel,
  serviceMsg,
  onRequest,
  t,
}: MenuServiceModalProps) {
  if (!serviceModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <BellIcon className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">
            Table {tableLabel} Assistance
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Tap what you need and our team will be right with you.
          </p>
        </div>

        {serviceMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span>{serviceMsg}</span>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onRequest("waiter")}
            className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 font-extrabold text-xs border border-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <BellIcon className="w-4 h-4" />
            <span>{t.callWaiter}</span>
          </button>
          <button
            type="button"
            onClick={() => onRequest("water")}
            className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 font-extrabold text-xs border border-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <DropletIcon className="w-4 h-4 text-cyan-400" />
            <span>{t.needWater}</span>
          </button>
          <button
            type="button"
            onClick={() => onRequest("clean")}
            className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 font-extrabold text-xs border border-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <SparklesIcon className="w-4 h-4 text-amber-400" />
            <span>{t.cleanTable}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-stone-500 hover:text-stone-300 font-medium pt-2 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
