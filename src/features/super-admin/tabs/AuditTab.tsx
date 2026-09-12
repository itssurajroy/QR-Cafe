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

export function AuditTab() {
  const ctx = useSuperAdmin();
  const { kpis, charts, tab, cafes, page, pageSize, totalCafes, searchQuery, selectedPlan, handleFastToggleStatus, handleFastExtendTrial, handleDeleteCafe, staff, platformConfig, savingConfigKey, handleSaveConfig, auditRows, auditActionFilter, loadFilteredAudit, auditLoading, setAuditActionFilter, setSearchQuery, setSelectedPlan, setDrawerCafeId, setDrawerTab, setDrawerData, setShowNewCafeModal } = ctx;

  return (
    <>
{/* TAB 5: AUDIT LOGS */}
          
            <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/50 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Platform Audit Event Stream</h3>
                  <p className="text-xs text-slate-500 dark:text-stone-400">Tamper-evident logs of billing, impersonation, and orders</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["", "super_impersonate", "super_extend_trial", "super_mark_paid", "self_onboarding"].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => loadFilteredAudit(act)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        auditActionFilter === act
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 dark:bg-stone-950 border-slate-200 dark:border-stone-800 text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {act ? act.replace("super_", "") : "All Events"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-stone-800 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-xs">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Entity</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Café</th>
                      <th className="pb-3">Details / Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60 font-mono text-xs">
                    {auditRows.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-stone-800/30">
                        <td className="py-2.5 text-slate-400 dark:text-stone-500 whitespace-nowrap">
                          {new Date(a.created_at).toLocaleTimeString("en-IN")} • {new Date(a.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-2.5 font-bold text-indigo-600">{a.entity}</td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">{a.action}</td>
                        <td className="py-2.5 text-slate-600 dark:text-stone-300">{a.restaurants?.name || a.restaurant_id || "System"}</td>
                        <td className="py-2.5 text-slate-500 dark:text-stone-400 truncate max-w-xs">
                          {JSON.stringify(a.metadata || {})}
                        </td>
                      </tr>
                    ))}
                    {auditRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-stone-500 font-sans">
                          {auditLoading ? "Loading audit logs…" : "No audit events found for this filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
    </>
  );
}