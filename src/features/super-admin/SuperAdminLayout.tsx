// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from 'react';
import { SuperSidebar, SuperMobileDrawer } from './SuperSidebar';
import { SuperHeader } from './SuperHeader';
import { useSuperAdmin } from './SuperAdminContext';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { tab, setTab, setMobileMenuOpen, toast, setToast } = useSuperAdmin();

  return (
    <div className="flex h-dvh bg-[#FAF9F6] text-slate-900 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white antialiased overflow-hidden">
      <SuperSidebar />
      <SuperMobileDrawer />
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6] relative">
        <SuperHeader />
        {toast && (
          <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
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
        <div className="p-3.5 sm:p-6 md:p-8 space-y-6 flex-1 overflow-y-auto pb-28 lg:pb-8">
          {children}
        </div>

        {/* SUPER ADMIN MOBILE BOTTOM BAR (lg:hidden) */}
        <nav
          aria-label="Super Admin Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1 pb-safe flex items-center justify-around shadow-lg shadow-black/5"
        >
          <button
            type="button"
            onClick={() => setTab("dashboard")}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target ${
              tab === "dashboard" ? "text-[#5738F5]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("cafes")}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target ${
              tab === "cafes" || tab === "restaurants" ? "text-[#5738F5]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Tenants</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target ${
              tab === "orders" ? "text-[#5738F5]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Orders</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("system-health")}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target ${
              tab === "system-health" ? "text-[#5738F5]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Health</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all text-slate-500 hover:text-slate-900 touch-target"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="6" cy="12" r="1.5" />
              <circle cx="18" cy="12" r="1.5" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
