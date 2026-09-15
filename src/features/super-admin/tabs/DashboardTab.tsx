// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function DashboardTab() {
  const ctx = useSuperAdmin();
  const { kpis, charts, openDrawer } = ctx;

  const mrrRupees = Math.round((kpis?.mrr || 0) / 100);
  const arrRupees = Math.round((kpis?.arr || 0) / 100);
  const todayRevRupees = Math.round((kpis?.todayRevenue || 0) / 100);
  const rev30dRupees = Math.round((kpis?.revenue30d || 0) / 100);

  const planData = [
    { name: "Active Paying", value: kpis?.active || 0, color: "#10B981" },
    { name: "Free Trial", value: kpis?.trial || 0, color: "#F59E0B" },
    { name: "Suspended / Inactive", value: (kpis?.suspended || 0) + (kpis?.expired || 0), color: "#94A3B8" },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* 4 Primary Executive Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MRR */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#5738F5]/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Platform MRR
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-[#5738F5] border border-violet-100">
              Monthly
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{mrrRupees.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {kpis?.active || 0} active cafés
            </span>
            <span>·</span>
            <span>₹999 / mo</span>
          </div>
        </div>

        {/* Card 2: Projected ARR */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#5738F5]/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Projected ARR
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
              Run Rate
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{arrRupees.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500">
            Annualized (MRR × 12)
          </div>
        </div>

        {/* Card 3: Active Cafes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Cafés
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
              {kpis?.active || 0} Paying
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {kpis?.total || 0}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="text-amber-600 font-medium">{kpis?.trial || 0} on free trial</span>
            <span>·</span>
            <span>{kpis?.new7d || 0} new this week</span>
          </div>
        </div>

        {/* Card 4: Today's Orders & Volume */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#5738F5]/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Today Dine-In Volume
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
              Live GMV
            </span>
          </div>
          <div className="text-3xl font-black text-[#5738F5] font-mono tracking-tight">
            ₹{todayRevRupees.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">{kpis?.todayOrders || 0}</span>
            <span>table tickets served today</span>
          </div>
        </div>
      </div>

      {/* 6 Secondary Operational Pulse Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trial Accounts</span>
          <div className="text-xl font-extrabold text-amber-600 font-mono">{kpis?.trial || 0}</div>
          <span className="text-[11px] text-slate-500">14-day evaluation</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiring (7d)</span>
          <div className="text-xl font-extrabold text-amber-600 font-mono">{kpis?.trialsEnding7d || 0}</div>
          <span className="text-[11px] text-slate-500">Follow-up window</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urgent (3d)</span>
          <div className="text-xl font-extrabold text-rose-600 font-mono">{kpis?.trialsEnding3d || 0}</div>
          <span className="text-[11px] text-slate-500">Closing trials</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Signups</span>
          <div className="text-xl font-extrabold text-[#5738F5] font-mono">{kpis?.new7d || 0}</div>
          <span className="text-[11px] text-slate-500">Past 7 days</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">30d Platform GMV</span>
          <div className="text-xl font-extrabold text-slate-900 font-mono">₹{rev30dRupees.toLocaleString("en-IN")}</div>
          <span className="text-[11px] text-slate-500">Gross volume</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suspended/Expired</span>
          <div className="text-xl font-extrabold text-slate-500 font-mono">{(kpis?.expired || 0) + (kpis?.suspended || 0)}</div>
          <span className="text-[11px] text-slate-500">Inactive plans</span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Platform Revenue Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">14-Day Platform Dine-In GMV</h3>
              <p className="text-xs text-slate-500">Aggregated customer table orders across all active cafés (in INR)</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#5738F5] bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
              Last 14 Days
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.revenue14 || []}>
                <defs>
                  <linearGradient id="violetRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5738F5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5738F5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-500">{label}</p>
                          <p className="font-mono font-black text-[#5738F5] text-sm">
                            ₹{(payload[0].value as number).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {data.orders || 0} dine-in tickets
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#5738F5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#violetRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution Donut */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Café Subscription Mix</h3>
            <p className="text-xs text-slate-500">Distribution of tenants by current plan</p>
          </div>

          <div className="h-44 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0];
                      return (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                          <span className="font-bold text-slate-700">{entry.name}: </span>
                          <span className="font-mono font-bold text-slate-900">{entry.value} cafés</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            {planData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                  <span className="text-slate-600 font-medium">{p.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 Cafés Leaderboard */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Top Performing Cafés (Past 14 Days)</h3>
            <p className="text-xs text-slate-500">Ranked by customer gross dine-in ordering volume</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="pb-3 w-16">Rank</th>
                <th className="pb-3">Café</th>
                <th className="pb-3">Tier</th>
                <th className="pb-3">14-Day GMV</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(charts?.topCafes || []).map((c: any, idx: number) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-mono font-black text-slate-400">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      idx === 0 ? "bg-amber-100 text-amber-800 font-bold" :
                      idx === 1 ? "bg-slate-100 text-slate-700 font-bold" :
                      idx === 2 ? "bg-amber-50 text-amber-700 font-bold" :
                      "text-slate-500"
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">/c/{c.slug}</div>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] border border-violet-100 font-bold uppercase text-[10px]">
                      {c.tier || "PRO"}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono font-bold text-emerald-600 text-sm">
                    ₹{Math.round((c.revenue_paise || 0) / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openDrawer(c.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#5738F5] font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Inspect Tenant</span>
                      <span>→</span>
                    </button>
                  </td>
                </tr>
              ))}
              {(!charts?.topCafes || charts.topCafes.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No order volume recorded in the past 14 days yet.
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

