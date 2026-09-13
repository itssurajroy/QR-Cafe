// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from 'react';
import Link from 'next/link';
import { useSuperAdmin } from './SuperAdminContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export function SuperSidebar() {
  const { tab, setTab, totalCafes, kpis, staff } = useSuperAdmin();

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-stone-900 border-r border-slate-200 dark:border-stone-800 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20">
              ⚡
            </div>
            <div>
              <h1 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">QRslice Platform</h1>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                Super Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "KPI & Analytics", icon: "📊" },
              { id: "cafes", label: "Cafés & Tenants", icon: "🏢", count: totalCafes },
              { id: "staff", label: "Staff Directory", icon: "👥", count: staff?.length || 0 },
              { id: "subscriptions", label: "Subscriptions", icon: "💳" },
              { id: "broadcast", label: "Broadcasts", icon: "📣" },
              { id: "health", label: "System Health", icon: "🩺" },
              { id: "content", label: "Content Mgmt", icon: "📝" },
              { id: "config", label: "Platform Config", icon: "⚙️" },
              { id: "audit", label: "Audit Event Logs", icon: "📜" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tab === item.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black"
                    : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-black ${
                      tab === item.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-stone-800 text-slate-500 dark:text-stone-400"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-stone-800 space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block">
              Monthly Recurring Rev
            </span>
            <div className="text-lg font-black text-indigo-600 font-mono">
              ₹{kpis.mrr.toLocaleString("en-IN")}
            </div>
            <span className="text-xs text-emerald-600 font-bold">
              {kpis.active} active paying subscribers
            </span>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
            >
              <span>🌐 View Public Site</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>
  );
}
