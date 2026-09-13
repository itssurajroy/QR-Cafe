// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from 'react';
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

  type FlagRow = {
    key: string;
    enabled: boolean;
    description: string;
    rollout_pct: number;
    allow_list: string[];
    updated_at: string;
  };
  const [flags, setFlags] = useState<FlagRow[] | null>(null);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [rolloutDrafts, setRolloutDrafts] = useState<Record<string, { rollout_pct: number; allow_list: string }>>({});
  const [savingFlagKey, setSavingFlagKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/super/flags");
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (cancelled) return;
        const rows: FlagRow[] = (data?.flags ?? []).map((f: any) => ({
          key: f.key,
          enabled: f.enabled === true,
          description: f.description ?? "",
          rollout_pct: typeof f.rollout_pct === "number" ? f.rollout_pct : 100,
          allow_list: Array.isArray(f.allow_list) ? f.allow_list : [],
          updated_at: f.updated_at ?? "",
        }));
        setFlags(rows);
        setRolloutDrafts(
          Object.fromEntries(
            rows.map((f) => [f.key, { rollout_pct: f.rollout_pct, allow_list: f.allow_list.join(", ") }])
          )
        );
      } catch {
        if (!cancelled) setFlagsError("Could not load feature flags");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveRollout(flag: FlagRow) {
    const draft = rolloutDrafts[flag.key] ?? { rollout_pct: flag.rollout_pct, allow_list: flag.allow_list.join(", ") };
    const rollout_pct = Math.max(0, Math.min(100, Math.round(Number(draft.rollout_pct) || 0)));
    const allow_list = draft.allow_list.split(",").map((s) => s.trim()).filter(Boolean);
    setSavingFlagKey(flag.key);
    try {
      const res = await fetch("/api/super/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: flag.key,
          enabled: flag.enabled,
          description: flag.description,
          rollout_pct,
          allow_list,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setFlags((prev) => (prev ?? []).map((f) => (f.key === flag.key ? { ...f, rollout_pct, allow_list } : f)));
    } catch {
      setFlagsError(`Could not save rollout for ${flag.key}`);
    } finally {
      setSavingFlagKey(null);
    }
  }

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

              {/* Feature Flag Rollouts */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/50">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Feature Flag Rollouts</h3>
                  <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                    Deterministic percentage rollout with tenant allow-list. Disabled flags stay off; allow-listed
                    tenants are always on; otherwise a stable hash of the tenant id decides.
                  </p>
                </div>
                {flagsError && <p className="text-xs font-bold text-red-600">{flagsError}</p>}
                {flags === null && !flagsError && (
                  <p className="text-xs text-slate-500 dark:text-stone-400">Loading flags…</p>
                )}
                {flags !== null && flags.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-stone-400">No feature flags yet.</p>
                )}
                {(flags ?? []).map((f) => {
                  const draft = rolloutDrafts[f.key] ?? { rollout_pct: f.rollout_pct, allow_list: f.allow_list.join(", ") };
                  return (
                    <div
                      key={f.key}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">{f.key}</div>
                          <p className="text-xs text-slate-500 dark:text-stone-400">{f.description || "—"}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold uppercase text-xs ${
                            f.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 dark:bg-stone-800 text-slate-500 dark:text-stone-400"
                          }`}
                        >
                          {f.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="space-y-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block">
                            Rollout %
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={draft.rollout_pct}
                            onChange={(e) =>
                              setRolloutDrafts((prev) => ({
                                ...prev,
                                [f.key]: { ...draft, rollout_pct: Number(e.target.value) },
                              }))
                            }
                            className="w-full bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block">
                            Allow-list (tenant UUIDs, comma-separated)
                          </span>
                          <input
                            type="text"
                            value={draft.allow_list}
                            onChange={(e) =>
                              setRolloutDrafts((prev) => ({
                                ...prev,
                                [f.key]: { ...draft, allow_list: e.target.value },
                              }))
                            }
                            placeholder="uuid-1, uuid-2"
                            className="w-full bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveRollout(f)}
                        disabled={savingFlagKey === f.key}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                      >
                        {savingFlagKey === f.key ? "Saving…" : "Save Rollout"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
    </>
  );
}
