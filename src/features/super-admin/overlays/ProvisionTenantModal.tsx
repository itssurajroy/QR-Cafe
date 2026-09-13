"use client";

import React from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function ProvisionTenantModal() {
  const ctx = useSuperAdmin();
  const { showNewCafeModal, setShowNewCafeModal, newCafeName, setNewCafeName, newCafeSlug, setNewCafeSlug, newCafeTier, setNewCafeTier, newCafePlan, setNewCafePlan, newCafeTagline, setNewCafeTagline, newCafePhone, setNewCafePhone, newCafeAddress, setNewCafeAddress, newCafeOwnerName, setNewCafeOwnerName, newCafeOwnerEmail, setNewCafeOwnerEmail, creatingCafe, handleCreateCafeSubmit } = ctx;
  const ownerEmailValid = !newCafeOwnerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCafeOwnerEmail.trim());

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
              <h3 className="font-black text-slate-900 dark:text-white text-base">Provision New Café Tenant</h3>
              <button
                type="button"
                onClick={() => setShowNewCafeModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
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
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-indigo-600 dark:text-indigo-400 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1">
                  Owner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newCafeOwnerName}
                  onChange={(e) => setNewCafeOwnerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  placeholder="owner@example.com"
                  value={newCafeOwnerEmail}
                  onChange={(e) => setNewCafeOwnerEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                {!ownerEmailValid && (
                  <p className="mt-1 text-[11px] font-bold text-red-600">Enter a valid email address.</p>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">All-in-One Pro Plan</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">₹999/mo (14d Free Trial)</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-stone-400 block">QR Menu, Live Kitchen, Billing, Inventory, Recipes</span>
              </div>

              <button
                type="submit"
                disabled={creatingCafe || !newCafeName || !newCafeSlug || !ownerEmailValid}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
              >
                {creatingCafe ? "Provisioning…" : "Create Café Tenant →"}
              </button>
            </form>
          </div>
        </div>
  );
}