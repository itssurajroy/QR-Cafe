// Copyright (c) 2026 QRslice. All rights reserved.
import React, { useState } from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function SubscriptionsTab() {
  const { tab, cafes, openDrawer } = useSuperAdmin();
  const [search, setSearch] = useState('');
  
  if (tab !== 'subscriptions') return null;

  // Calculate stats based on cafe plan & billing_status
  const activeCafes = cafes.filter((c: any) => c.plan === 'active' || c.billing_status === 'active');
  const trialCafes = cafes.filter((c: any) => c.plan === 'trial' || (!c.plan && c.billing_status !== 'active'));
  const suspendedCafes = cafes.filter((c: any) => c.plan === 'suspended' || c.plan === 'cancelled');
  
  // Single plan at ₹999/month
  const mrr = activeCafes.length * 999;

  const filtered = cafes.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* MRR Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Total MRR</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{mrr.toLocaleString('en-IN')}<span className="text-sm text-slate-400 font-medium">/mo</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 inline-block px-2 py-1 rounded-md font-bold">
            ₹999 / active subscriber
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Active Paid Tenants</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{activeCafes.length}</div>
          <div className="mt-2 text-xs text-slate-400">Generating recurring revenue</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">In Free Trial</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{trialCafes.length}</div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">14-day evaluation period</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search subscriptions by tenant name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none flex-1"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/50 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Tenant</th>
                <th className="p-4 font-bold">Plan</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Rate</th>
                <th className="p-4 font-bold">Billing Cycle</th>
                <th className="p-4 font-bold">Expiry / Renewal</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {filtered.map((c: any) => {
                const isPaid = c.plan === 'active' || c.billing_status === 'active';
                const isTrial = c.plan === 'trial' || (!c.plan && !isPaid);
                const isSuspended = c.plan === 'suspended' || c.plan === 'cancelled';
                const statusLabel = isPaid ? 'Active' : isTrial ? 'Trial' : isSuspended ? 'Suspended' : 'Free';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-slate-500 text-[10px]">/c/{c.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-md font-black uppercase text-[10px]">
                        {c.tier || 'Pro'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                        isTrial ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                      }`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {isPaid ? '₹999/mo' : 'Free'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-stone-400 font-medium">Monthly</td>
                    <td className="p-4 text-slate-500 dark:text-stone-400 font-mono">
                      {c.subscription_ends_at
                        ? new Date(c.subscription_ends_at).toLocaleDateString('en-IN')
                        : c.trial_ends_at
                        ? new Date(c.trial_ends_at).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDrawer(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    No subscriptions match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

