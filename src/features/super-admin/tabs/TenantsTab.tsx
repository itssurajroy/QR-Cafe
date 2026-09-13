// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from 'react';
import { useSuperAdmin } from '../SuperAdminContext';
import Link from 'next/link';
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

export function TenantsTab() {
  const ctx = useSuperAdmin();
  
  const handleImpersonate = async (cafeId: string) => {
    try {
      const res = await fetch('/api/super/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId })
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(data.error || 'Failed to impersonate');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const { kpis, charts, applyFilter, handleExportCSV, openDrawer, totalPages, tab, cafes, page, pageSize, totalCafes, searchQuery, selectedPlan, handleFastToggleStatus, handleFastExtendTrial, handleDeleteCafe, staff, platformConfig, savingConfigKey, handleSaveConfig, auditRows, auditActionFilter, loadFilteredAudit, auditLoading, setAuditActionFilter, setSearchQuery, setSelectedPlan, setDrawerCafeId, setDrawerTab, setDrawerData, setShowNewCafeModal } = ctx;

  return (
    <>
{/* TAB 2: CAFES & TENANTS LIST WITH SERVER SEARCH & FILTER */}
          
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl">
                <div className="flex-1 w-full sm:w-auto flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by café name or slug…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilter(searchQuery, selectedPlan);
                    }}
                    className="bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none flex-1"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        applyFilter("", selectedPlan);
                      }}
                      className="text-slate-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedPlan}
                    onChange={(e) => {
                      setSelectedPlan(e.target.value);
                      applyFilter(searchQuery, e.target.value);
                    }}
                    className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none"
                  >
                    <option value="">All Plans (All)</option>
                    <option value="active">Active Paying</option>
                    <option value="trial">Free Trial</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => applyFilter(searchQuery, selectedPlan)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Search
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-slate-300 dark:border-stone-700"
                    title="Export filtered records to CSV"
                  >
                    <span>📥 Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Tenants Table */}
              <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/60 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-xs">
                        <th className="p-4">Café & Domain</th>
                        <th className="p-4">Tier</th>
                        <th className="p-4">Plan Status</th>
                        <th className="p-4">Trial / Sub Expiry</th>
                        <th className="p-4">Pricing</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
                      {cafes.map((c: any) => {
                        const isTrial = c.plan === "trial";
                        const isActive = c.plan === "active";
                        const isSuspended = c.plan === "suspended";

                        return (
                          <tr
                            key={c.id}
                            onClick={() => openDrawer(c.id)}
                            className="hover:bg-slate-50 dark:hover:bg-stone-800/40 transition-colors cursor-pointer group"
                          >
                            <td className="p-4">
                              <div className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                {c.name}
                              </div>
                              <span className="text-xs font-mono text-slate-500 dark:text-stone-400">
                                /c/{c.slug}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full font-black uppercase text-xs bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-stone-300">
                                {c.tier || "pro"}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full font-black uppercase text-xs border ${
                                  isActive
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                    : isTrial
                                    ? "bg-amber-50 border-amber-300 text-amber-800"
                                    : "bg-red-50 border-red-300 text-red-700"
                                }`}
                              >
                                {c.plan}
                              </span>
                            </td>

                            <td className="p-4 text-slate-600 dark:text-stone-400 font-mono text-xs">
                              {isActive
                                ? c.subscription_ends_at
                                  ? new Date(c.subscription_ends_at).toLocaleDateString("en-IN")
                                  : "Continuous"
                                : isTrial && c.trial_ends_at
                                ? `${new Date(c.trial_ends_at).toLocaleDateString("en-IN")}`
                                : "Expired"}
                            </td>

                            <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                              ₹999/mo
                            </td>

                            <td className="p-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleFastExtendTrial(c.id, e)}
                                title="Add 7 Free Trial Days"
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs cursor-pointer"
                              >
                                +7d Trial
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleFastToggleStatus(c, e)}
                                title="Toggle Active / Suspended"
                                className={`px-2 py-1 rounded-lg border font-bold text-xs cursor-pointer ${
                                  c.plan === "suspended"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                {c.plan === "suspended" ? "Activate" : "Suspend"}
                              </button>
                              <Link
                                href={`/super/cafe/${c.id}`}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 border border-slate-300 dark:border-stone-700 font-bold text-xs inline-block transition-colors cursor-pointer"
                              >
                                🕵️ Impersonate
                              </Link>
                              <Link
                                href={`/c/${c.slug}`}
                                target="_blank"
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-600 dark:text-stone-400 hover:text-slate-900 font-bold text-xs inline-block transition-colors"
                              >
                                View ↗
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                      {cafes.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-stone-500">
                            No cafés match the selected filter query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/40 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-stone-400">
                    Showing <strong>{cafes.length}</strong> of <strong>{totalCafes}</strong> cafés (Page {page} of {totalPages})
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => applyFilter(searchQuery, selectedPlan, page - 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 dark:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    >
                      &larr; Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => applyFilter(searchQuery, selectedPlan, page + 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 dark:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
    </>
  );
}
