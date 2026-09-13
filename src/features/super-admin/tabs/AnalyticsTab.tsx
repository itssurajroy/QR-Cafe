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

const TOOLTIP_STYLE = {
  backgroundColor: "#1c1917",
  borderColor: "#44403c",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#fff",
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
      // audit trail unavailable — flat line below still renders.
    }
    const points: { month: string; mrr: number }[] = [];
    let after = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.now() - i * 30 * 864e5);
      const mrr = Math.max(0, Math.round((currentMrr - after * monthlyPaise) / 100));
      points.push({ month: d.toISOString().slice(0, 7), mrr });
      after += changes[i] ?? 0;
    }
    return points;
  }, [auditRows, currentMrr, monthlyPaise]);

  // Funnel: signups → menu>0 → orders>0 → active. Menu depth is not in context,
  // so that stage degrades to null ("—") instead of guessing.
  const funnel = useMemo(() => {
    const signups: number = kpis?.total ?? 0;
    const withOrders: number = Array.isArray(charts?.topCafes) ? charts.topCafes.length : 0;
    const active: number = kpis?.active ?? 0;
    return [
      { stage: "Signups", value: signups },
      { stage: "Menu live", value: null as number | null },
      { stage: "Orders > 0", value: withOrders },
      { stage: "Active", value: active },
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
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    } catch {
      return [];
    }
  }, [auditRows]);

  return (
    <div className="space-y-6">
      {/* MRR movement */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">MRR Movement (12 Months)</h3>
            <p className="text-xs text-slate-500 dark:text-stone-400">
              Reconstructed from current MRR + subscription change audits, in INR
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600">Last 12 Mo</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrMovement}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#78716c" fontSize={10} tickLine={false} />
              <YAxis stroke="#78716c" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#mrrGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Tenant Funnel</h3>
            <p className="text-xs text-slate-500 dark:text-stone-400">Signups → live menu → ordering → active plan</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel.filter((f) => f.value !== null)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" stroke="#78716c" fontSize={10} tickLine={false} />
                <YAxis type="category" dataKey="stage" stroke="#78716c" fontSize={11} tickLine={false} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {funnel.some((f) => f.value === null) && (
            <p className="text-xs text-slate-400 dark:text-stone-500">
              Menu-live depth is not tracked yet — stage omitted instead of estimated.
            </p>
          )}
        </div>

        {/* Feature usage */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Feature Usage</h3>
            <p className="text-xs text-slate-500 dark:text-stone-400">Top operator actions from the audit trail</p>
          </div>
          {featureUsage.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 dark:text-stone-500">
              No audit actions recorded yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis type="number" stroke="#78716c" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="action" stroke="#78716c" fontSize={10} tickLine={false} width={140} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
