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

export function DashboardTab() {
  const ctx = useSuperAdmin();
  const { kpis, charts, openDrawer, tab, cafes, page, pageSize, totalCafes, searchQuery, selectedPlan, handleFastToggleStatus, handleFastExtendTrial, handleDeleteCafe, staff, platformConfig, savingConfigKey, handleSaveConfig, auditRows, auditActionFilter, loadFilteredAudit, auditLoading, setAuditActionFilter, setSearchQuery, setSelectedPlan, setDrawerCafeId, setDrawerTab, setDrawerData, setShowNewCafeModal } = ctx;

  return (
    <>
{/* TAB 1: DASHBOARD & RECHARTS ANALYTICS */}
          
            <div className="space-y-6">
              {/* 6 Key Platform Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider block">Total Cafés</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.total}</div>
                  <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">Across all regions</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Active Plan</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">{kpis.active}</div>
                  <span className="text-xs text-emerald-600/80 font-medium">Paying monthly</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/40 space-y-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Free Trials</span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{kpis.trial}</div>
                  <span className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">14-day trial mode</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider block">Today Revenue</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    ₹{Math.round(kpis.todayRevenue / 100).toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">{kpis.todayOrders} dine-in tickets</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider block">MRR Total</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    ₹{kpis.mrr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Single ₹999 plan</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider block">New (7 Days)</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.new7dCafes}</div>
                  <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">Signups this week</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider block">Trials Ending 7d</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.trialsEnding7d}</div>
                  <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">Trials expiring this week</span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider block">New Sign-ups (7d)</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.new7d}</div>
                  <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">Signups this week</span>
                </div>
              </div>

              {/* Recharts Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 14-Day Platform Revenue Area Chart */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">14-Day Platform Dine-In Revenue</h3>
                      <p className="text-xs text-slate-500 dark:text-stone-400">Total volume across all café tenants in INR</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600">Last 14 Days</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.revenue14}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#78716c" fontSize={10} tickLine={false} />
                        <YAxis stroke="#78716c" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1c1917",
                            borderColor: "#44403c",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#revGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subscription Plan Distribution Donut */}
                <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Café Subscription Mix</h3>
                    <p className="text-xs text-slate-500 dark:text-stone-400">Distribution by plan status</p>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.byPlan}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.byPlan.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1c1917",
                            borderColor: "#44403c",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-stone-800">
                    {charts.byPlan.map((p: any) => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                          <span className="text-slate-600 dark:text-stone-300 font-medium">{p.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top 10 Cafés by Volume */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Top Performing Cafés (14 Days)</h3>
                    <p className="text-xs text-slate-500 dark:text-stone-400">Ranked by gross customer dine-in volume</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-stone-800 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-xs">
                        <th className="pb-3">Rank</th>
                        <th className="pb-3">Café</th>
                        <th className="pb-3">Tier</th>
                        <th className="pb-3">14-Day Sales</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
                      {charts.topCafes.map((c: any, idx: number) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-stone-800/30 transition-colors">
                          <td className="py-3 font-mono font-bold text-indigo-600">#{idx + 1}</td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">
                            {c.name} <span className="text-slate-400 dark:text-stone-500 font-normal">(/c/{c.slug})</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 font-bold uppercase text-xs">
                              {c.tier}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-black text-emerald-600">
                            ₹{Math.round(c.revenue_paise / 100).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openDrawer(c.id)}
                              className="px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer"
                            >
                              Inspect &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                      {charts.topCafes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-stone-500">
                            No orders recorded in the past 14 days yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
    </>
  );
}
