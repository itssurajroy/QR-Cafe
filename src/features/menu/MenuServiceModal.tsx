// Copyright (c) 2026 QRslice. All rights reserved.
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
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white border border-slate-200/90 rounded-[2rem] p-6 space-y-4 shadow-2xl text-center animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-[#5738F5] border border-violet-200 flex items-center justify-center mx-auto shadow-sm">
          <BellIcon className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Table {tableLabel} Assistance
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tap your request below and our team will attend to Table {tableLabel} immediately.
          </p>
        </div>

        {serviceMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{serviceMsg}</span>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onRequest("waiter")}
            className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-gradient-to-r hover:from-[#5738F5] hover:to-[#7C3AED] hover:text-white text-slate-800 font-black text-xs border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm group"
          >
            <BellIcon className="w-4 h-4 text-[#5738F5] group-hover:text-white transition-colors" />
            <span>{t.callWaiter}</span>
          </button>
          <button
            type="button"
            onClick={() => onRequest("water")}
            className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-gradient-to-r hover:from-[#5738F5] hover:to-[#7C3AED] hover:text-white text-slate-800 font-black text-xs border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm group"
          >
            <DropletIcon className="w-4 h-4 text-sky-500 group-hover:text-white transition-colors" />
            <span>{t.needWater}</span>
          </button>
          <button
            type="button"
            onClick={() => onRequest("clean")}
            className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-gradient-to-r hover:from-[#5738F5] hover:to-[#7C3AED] hover:text-white text-slate-800 font-black text-xs border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm group"
          >
            <SparklesIcon className="w-4 h-4 text-amber-500 group-hover:text-white transition-colors" />
            <span>{t.cleanTable}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-700 font-bold pt-2 cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
