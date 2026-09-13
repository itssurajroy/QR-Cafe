// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";

type Health = { failedWebhooks: number; errorAudits: number; failedPayments: number; checked_at: string };

const ZERO: Health = { failedWebhooks: 0, errorAudits: 0, failedPayments: 0, checked_at: "" };

function Indicator({ label, value, degraded }: { label: string; value: number; degraded: boolean }) {
  const bad = value > 0;
  const dot = degraded ? "bg-slate-400" : bad ? "bg-red-500" : "bg-emerald-500";
  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm">
      <div className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">{label}</div>
      <div className="mt-3 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`}></div>
        <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{degraded ? "—" : value}</span>
      </div>
      <div className="text-xs text-slate-400 mt-1">Last 24 hours</div>
    </div>
  );
}

export function SystemHealthTab() {
  const [health, setHealth] = useState<Health>(ZERO);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/super/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data.health ?? ZERO);
      setDegraded(false);
    } catch {
      // Task-1 tables may be missing live — degrade to zeros, never crash.
      setHealth(ZERO);
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">System Health</h2>
          <p className="text-xs text-slate-500 dark:text-stone-400">
            {loading
              ? "Checking signals…"
              : degraded
                ? "Health signals unavailable — showing degraded defaults."
                : `Checked at ${health.checked_at ? new Date(health.checked_at).toLocaleString() : "—"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Indicator label="Failed webhooks" value={health.failedWebhooks} degraded={degraded} />
        <Indicator label="Error audits" value={health.errorAudits} degraded={degraded} />
        <Indicator label="Failed payments" value={health.failedPayments} degraded={degraded} />
      </div>
    </div>
  );
}
