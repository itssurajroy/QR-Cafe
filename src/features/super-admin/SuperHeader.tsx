"use client";

import React from 'react';
import Link from 'next/link';
import { useSuperAdmin } from './SuperAdminContext';

export function SuperHeader() {
  const { tab, setShowNewCafeModal } = useSuperAdmin();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-stone-400">Section:</span>
            <h2 className="text-sm font-black text-slate-900 dark:text-white capitalize">{tab} Management</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNewCafeModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>＋ New Café Tenant</span>
            </button>
            <Link
              href="/login"
              className="text-xs text-slate-500 dark:text-stone-400 hover:text-stone-200 border border-slate-200 dark:border-stone-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800 dark:bg-stone-800 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </header>
  );
}