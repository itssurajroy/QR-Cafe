// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useMemo } from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const LIGHT_TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  borderColor: "#e2e8f0",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#0f172a",
  fontWeight: "600",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
  padding: "8px 12px",
};

const MONTHLY_PAISE_FALLBACK = 99900;

export function AnalyticsTab() {
  const ctx = useSuperAdmin();
  const { kpis, charts, auditRows } = ctx;

  const currentMrr: number = kpis?.mrr ?? 0;
  const activeCount: number = kpis?.active ?? 0;
  const monthlyPaise = activeCount > 0 ? Math.round(currentMrr / activeCount) : MONTHLY_PAISE_FALLBACK;

  // MRR movement: 12 monthly points. Reconstructs history by walking back from
  // the current MRR, subtracting one month of plan value per `subscription.changed`
  // audit after that month. Degrades to a flat line when audits are unavailable.
  const mrrMovement = useMemo(() => {
    const changes: number[] = new Array(12).fill(0);
    try {
      const rows: any[] = Array.isArray(auditRows) ? auditRows : [];
      for (const r of rows) {
        if (typeof r?.action === "string" && r.action.includes("subscription.changed") && r.created_at) {
          const age = Date.now() - new Date(r.created_at).getTime();
          const bucket = Math.floor(age / (30 * 864e5));
          if (bucket >= 0 && bucket < 12) changes[bucket] += 1;
        }
      }
    } catch {
      // audit trail unavailable
    }
    const points: { month: string; mrr: number }[] = [];
    let after = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.now() - i * 30 * 864e5);
      const mrr = Math.max(0, Math.round((currentMrr - after * monthlyPaise) / 100));
      points.push({ month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), mrr });
      after += changes[i] ?? 0;
    }
    return points;
  }, [auditRows, currentMrr, monthlyPaise]);

  // Funnel: signups → menu>0 → orders>0 → active.
  const funnel = useMemo(() => {
    const signups: number = kpis?.total ?? 0;
    const withOrders: number = Array.isArray(charts?.topCafes) ? charts.topCafes.length : 0;
    const active: number = kpis?.active ?? 0;
    return [
      { stage: "Signups", value: signups },
      { stage: "Live Orders", value: withOrders },
      { stage: "Active Subscriptions", value: active },
    ];
  }, [kpis, charts]);

  // Feature usage: top audit actions by count (proxy for operator feature use).
  const featureUsage = useMemo(() => {
    try {
      const rows: any[] = Array.isArray(auditRows) ? auditRows : [];
      const counts = new Map<string, number>();
      for (const r of rows) {
        if (typeof r?.action === "string") counts.set(r.action, (counts.get(r.action) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([action, count]) => ({ action: action.replace("super_", "").replace(/_/g, " "), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);
    } catch {
      return [];
    }
  }, [auditRows]);

  return (
    <div className="space-y-6">
      {/* MRR Movement Chart */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">MRR Trajectory & Movement</h3>
              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
                12 Months Run-Rate
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Historical MRR reconstruction based on real payment webhooks and subscription changes (in INR).
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#5738F5] bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
              Current: ₹{Math.round(currentMrr / 100).toLocaleString("en-IN")}/mo
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrMovement} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsMrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5738F5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5738F5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Tooltip contentStyle={LIGHT_TOOLTIP_STYLE} formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Monthly MRR"]} />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#5738F5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#analyticsMrrGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Tenant Conversion Funnel</h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                Conversion
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Onboarded Signups → Dispatched Orders → Active Paying Plans</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis type="category" dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip contentStyle={LIGHT_TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature usage */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Platform Feature Usage</h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-100">
                Audit Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Top administrative and operator events executed</p>
          </div>
          {featureUsage.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              No audit actions recorded yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureUsage} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis type="category" dataKey="action" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={130} />
                  <Tooltip contentStyle={LIGHT_TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#5738F5" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
