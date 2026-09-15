// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

export function ConfigTab() {
  const ctx = useSuperAdmin();
  const { platformConfig, setPlatformConfig, handleSaveConfig, savingConfigKey } = ctx;

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
    <div className="max-w-4xl space-y-6">
      {/* Global Config Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Global SaaS Platform Configuration</h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
              Live Runtime
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            System defaults and operational toggles stored in database-backed <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px]">platform_config</code>.
          </p>
        </div>

        {/* Signups Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <div className="font-bold text-xs text-slate-900">Self-Serve Café Onboarding</div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Permit new prospective café owners to self-register via /onboarding</p>
          </div>
          <button
            type="button"
            onClick={() =>
              handleSaveConfig("signups_open", {
                enabled: !platformConfig?.signups_open?.enabled,
              })
            }
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
              platformConfig?.signups_open?.enabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            {platformConfig?.signups_open?.enabled ? "Signups Open ✓" : "Signups Closed ✕"}
          </button>
        </div>

        {/* Trial Length */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <div className="font-bold text-xs text-slate-900">Default Free Trial Duration</div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Days of full premium access granted automatically upon tenant onboarding</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={90}
              value={platformConfig?.trial_days?.days ?? 14}
              onChange={(e) =>
                setPlatformConfig((prev: any) => ({
                  ...prev,
                  trial_days: { days: Number(e.target.value) },
                }))
              }
              className="w-18 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 text-center font-mono font-bold"
            />
            <span className="text-xs font-semibold text-slate-500">days</span>
            <button
              type="button"
              onClick={() => handleSaveConfig("trial_days", platformConfig?.trial_days)}
              disabled={savingConfigKey === "trial_days"}
              className="px-3.5 py-1.5 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold text-xs cursor-pointer shadow-sm ml-2"
            >
              Save
            </button>
          </div>
        </div>

        {/* Pricing Defaults */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div>
            <div className="font-bold text-xs text-slate-900">Monthly Subscription Pricing (INR)</div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Baseline recurring subscription price billed per tenant café</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                value={platformConfig?.prices?.pro ?? 999}
                onChange={(e) =>
                  setPlatformConfig((prev: any) => ({
                    ...prev,
                    prices: { ...prev.prices, pro: Number(e.target.value) },
                  }))
                }
                className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs text-slate-900 font-mono font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSaveConfig("prices", platformConfig?.prices)}
              className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              Update Pricing Rate
            </button>
          </div>
        </div>
      </div>

      {/* Feature Flag Rollouts */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Feature Flag Rollouts</h3>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
              Canary & Staged
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Deterministic percentage rollout with tenant allow-list. Disabled flags remain off; allow-listed tenants always evaluate to true.
          </p>
        </div>

        {flagsError && <p className="text-xs font-bold text-rose-600">{flagsError}</p>}
        {flags === null && !flagsError && (
          <p className="text-xs text-slate-500">Loading rollout flags…</p>
        )}
        {flags !== null && flags.length === 0 && (
          <p className="text-xs text-slate-500">No feature flags configured yet.</p>
        )}

        {(flags ?? []).map((f) => {
          const draft = rolloutDrafts[f.key] ?? { rollout_pct: f.rollout_pct, allow_list: f.allow_list.join(", ") };
          return (
            <div
              key={f.key}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono font-bold text-xs text-slate-900">{f.key}</div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{f.description || "System capability flag"}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider border ${
                    f.enabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}
                >
                  {f.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Rollout Percentage ({draft.rollout_pct}%)
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Tenant UUID Allow-list (comma separated)
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
                    placeholder="tenant-uuid-1, tenant-uuid-2"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono text-[11px]"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => handleSaveRollout(f)}
                disabled={savingFlagKey === f.key}
                className="px-3.5 py-1.5 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
              >
                {savingFlagKey === f.key ? "Updating Flag…" : "Save Rollout Settings"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
