import React from 'react';
import { useSuperAdmin } from '../SuperAdminContext';

export function HealthTab() {
  const { tab } = useSuperAdmin();
  
  if (tab !== 'health') return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">Database Status</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xl font-black text-slate-900 dark:text-white">Healthy</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">42ms latency</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">API Error Rate</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-xl font-black text-slate-900 dark:text-white">0.02%</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Last 24 hours</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">Storage Usage</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xl font-black text-slate-900 dark:text-white">4.2 GB</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">of 50 GB limit</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">Active Tenants</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="text-xl font-black text-slate-900 dark:text-white">Live</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">No disruptions detected</div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-950/30 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800 dark:text-stone-200">Recent Webhook Logs</h3>
          <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
        </div>
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-stone-800 mb-3 text-xl">
            🎣
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-stone-300">No recent webhook errors</h4>
          <p className="text-xs text-slate-500 dark:text-stone-500 mt-1">All payment and notification webhooks are processing normally.</p>
        </div>
      </div>
    </div>
  );
}
