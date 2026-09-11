"use client";

import React from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function ProvisionTenantModal() {
  const ctx = useSuperAdmin();
  const { showNewCafeModal, setShowNewCafeModal, newCafeName, setNewCafeName, newCafeSlug, setNewCafeSlug, newCafeTier, setNewCafeTier, newCafePlan, setNewCafePlan, newCafeTagline, setNewCafeTagline, newCafePhone, setNewCafePhone, newCafeAddress, setNewCafeAddress, creatingCafe, handleCreateCafeSubmit } = ctx;

  if (!showNewCafeModal) return null;

  return (
    <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowNewCafeModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-stone-800 pb-3">
              <h3 className="font-black text-white text-base">Provision New Café Tenant</h3>
              <button
                type="button"
                onClick={() => setShowNewCafeModal(false)}
                className="text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white dark:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCafeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1">
                  Café Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amber Artisan Coffee"
                  value={newCafeName}
                  onChange={(e) => {
                    setNewCafeName(e.target.value);
                    setNewCafeSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
                    );
                  }}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="amber-coffee"
                  value={newCafeSlug}
                  onChange={(e) => setNewCafeSlug(e.target.value.toLowerCase())}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-indigo-600 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">Basic Plan</span>
                  <span className="text-indigo-600 font-mono font-bold text-xs">₹699/mo</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-stone-400 block">QR Menu, Orders, Billing, Inventory</span>
              </div>

              <button
                type="submit"
                disabled={creatingCafe || !newCafeName || !newCafeSlug}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 dark:text-white font-black text-xs shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
              >
                {creatingCafe ? "Provisioning…" : "Create Café Tenant →"}
              </button>
            </form>
          </div>
        </div>
  );
}