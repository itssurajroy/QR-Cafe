// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from 'react';
import { useSuperAdmin } from '../SuperAdminContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function ConfigTab() {
  const ctx = useSuperAdmin();
  const { kpis, charts, setPlatformConfig, tab, cafes, page, pageSize, totalCafes, searchQuery, selectedPlan, handleFastToggleStatus, handleFastExtendTrial, handleDeleteCafe, staff, platformConfig, savingConfigKey, handleSaveConfig, auditRows, auditActionFilter, loadFilteredAudit, auditLoading, setAuditActionFilter, setSearchQuery, setSelectedPlan, setDrawerCafeId, setDrawerTab, setDrawerData, setShowNewCafeModal } = ctx;

  return (
    <>
{/* TAB 4: PLATFORM CONFIGURATION */}
          
            <div className="max-w-3xl space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-6 shadow-xl dark:shadow-2xl dark:shadow-black/50">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Global SaaS Platform Configuration</h3>
                  <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                    Live system flags and pricing defaults stored in `platform_config`.
                  </p>
                </div>

                {/* Signups Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Self-Serve Signups</div>
                    <p className="text-xs text-slate-500 dark:text-stone-400">Allow new café owners to register via /onboarding</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveConfig("signups_open", {
                        enabled: !platformConfig?.signups_open?.enabled,
                      })
                    }
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      platformConfig?.signups_open?.enabled
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-stone-800 text-slate-600 dark:text-stone-400"
                    }`}
                  >
                    {platformConfig?.signups_open?.enabled ? "Enabled ✓" : "Disabled ✕"}
                  </button>
                </div>

                {/* Trial Length */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Default Free Trial Duration</div>
                    <p className="text-xs text-slate-500 dark:text-stone-400">Days of full access granted upon onboarding</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={platformConfig?.trial_days?.days ?? 30}
                      onChange={(e) =>
                        setPlatformConfig((prev: any) => ({
                          ...prev,
                          trial_days: { days: Number(e.target.value) },
                        }))
                      }
                      className="w-16 bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white text-center font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveConfig("trial_days", platformConfig?.trial_days)}
                      disabled={savingConfigKey === "trial_days"}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Pricing Defaults */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-3">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Monthly Subscription Pricing (INR)</div>
                    <p className="text-xs text-slate-500 dark:text-stone-400">Default recurring rate displayed across the platform</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block mb-1">
                      All-in-One Plan (₹)
                    </label>
                    <input
                      type="number"
                      value={platformConfig?.prices?.pro ?? 999}
                      onChange={(e) =>
                        setPlatformConfig((prev: any) => ({
                          ...prev,
                          prices: { ...prev.prices, pro: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveConfig("prices", platformConfig?.prices)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Update Plan Rate
                  </button>
                </div>
              </div>
            </div>
    </>
  );
}
