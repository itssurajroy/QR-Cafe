import React, { useState } from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function SubscriptionsTab() {
  const { tab, cafes } = useSuperAdmin();
  const [search, setSearch] = useState('');
  
  if (tab !== 'subscriptions') return null;

  // Calculate some dummy MRR stats based on cafes
  const activeCafes = cafes.filter((c: any) => c.status === 'active');
  const trialCafes = cafes.filter((c: any) => c.status === 'trial');
  
  const mrr = activeCafes.length * 29; // Assume $29/mo

  const filtered = cafes.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* MRR Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Total MRR</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">${mrr}<span className="text-sm text-slate-400 font-medium">/mo</span></div>
          <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 inline-block px-2 py-1 rounded-md font-bold">+12% this month</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Active Paid Tenants</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{activeCafes.length}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">In Trial</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{trialCafes.length}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search subscriptions by tenant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white placeholder-stone-400 focus:outline-none flex-1"
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
                <th className="p-4 font-bold">Billing Cycle</th>
                <th className="p-4 font-bold">Trial Ends</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="text-slate-500 text-[10px]">{c.slug}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-md font-black uppercase text-[10px]">
                      {c.plan || 'Free'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      c.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                      c.status === 'trial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                      'bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-stone-400 font-medium">Monthly</td>
                  <td className="p-4 text-slate-500 dark:text-stone-400 font-mono">
                    {c.trial_ends_at ? new Date(c.trial_ends_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
