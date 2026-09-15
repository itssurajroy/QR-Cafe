// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from 'react';
import { SuperSidebar } from './SuperSidebar';
import { SuperHeader } from './SuperHeader';
import { useSuperAdmin } from './SuperAdminContext';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { toast, setToast } = useSuperAdmin();

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-slate-900 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white antialiased overflow-hidden">
      <SuperSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6]">
        <SuperHeader />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold ${
                toast.kind === "ok"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
                  : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
              }`}
            >
              <span>{toast.kind === "ok" ? "✓" : "✕"}</span>
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="opacity-70 hover:opacity-100 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
