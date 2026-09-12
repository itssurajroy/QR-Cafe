"use client";

import React from 'react';
import { SuperSidebar } from './SuperSidebar';
import { SuperHeader } from './SuperHeader';
import { useSuperAdmin } from './SuperAdminContext';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { toast, setToast } = useSuperAdmin();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-stone-950">
      <SuperSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperHeader />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold ${
                toast.kind === "ok"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20"
                  : "bg-red-600 text-white border-red-500 shadow-red-900/20"
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
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

