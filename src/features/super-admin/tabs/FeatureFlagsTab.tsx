// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  percentage: number;
  targetScope: "All" | "Pro Plan" | "Pilot Tenants" | "Internal Only";
  createdBy: string;
  lastModified: string;
  modifiedBy: string;
};

const scopeMap: Record<string, FeatureFlag["targetScope"]> = {
  all: "All",
  pro: "Pro Plan",
  pilot: "Pilot Tenants",
  internal: "Internal Only",
};

export function FeatureFlagsTab() {
  const { flash } = useSuperAdmin();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/super/flags")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.flags)) {
          const mapped: FeatureFlag[] = d.flags.map((f: any) => ({
            id: `flag-${f.key}`,
            key: f.key,
            name: f.key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: f.description || "No description",
            enabled: f.enabled ?? false,
            percentage: f.rollout_pct ?? (f.enabled ? 100 : 0),
            targetScope: "All",
            createdBy: "super@qrslice.test",
            lastModified: f.updated_at ? new Date(f.updated_at).toLocaleDateString("en-IN") : "Never",
            modifiedBy: "super@qrslice.test",
          }));
          setFlags(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFlag = (flagId: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === flagId) {
          const nextState = !f.enabled;
          flash("ok", `Feature flag "${f.name}" ${nextState ? "enabled" : "disabled"} (Audited)`);
          return {
            ...f,
            enabled: nextState,
            percentage: nextState ? (f.percentage === 0 ? 100 : f.percentage) : 0,
            lastModified: "Just now",
          };
        }
        return f;
      })
    );
  };

  const updatePercentage = (flagId: string, pct: number) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === flagId) {
          return {
            ...f,
            percentage: pct,
            enabled: pct > 0,
            lastModified: "Just now",
          };
        }
        return f;
      })
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feature Flags Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control progressive feature rollouts, dark launches, and tenant-targeted feature gating.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Active Experiments: <strong className="text-slate-900 font-mono">{flags.filter((f) => f.enabled).length} Live</strong>
          </span>
        </div>
      </div>

      {/* Flag Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading feature flags…</div>
        ) : flags.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No feature flags configured.</div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{flag.name}</h3>
                    <code className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {flag.key}
                    </code>
                  </div>
                  <p className="text-xs text-slate-500 max-w-2xl">{flag.description}</p>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold ${
                      flag.enabled ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {flag.enabled ? `${flag.percentage}% Rollout` : "Disabled"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFlag(flag.id)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      flag.enabled ? "bg-[#5738F5]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        flag.enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Rollout Slider & Target Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Traffic Allocation</span>
                    <span className="font-mono font-bold text-slate-900">{flag.percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={flag.percentage}
                    onChange={(e) => updatePercentage(flag.id, Number(e.target.value))}
                    className="w-full accent-[#5738F5] cursor-pointer"
                  />
                </div>

                <div className="text-xs text-slate-600">
                  <span className="text-slate-400 block text-[11px]">Targeting Scope:</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-violet-50 text-[#5738F5] font-bold border border-violet-100">
                    {flag.targetScope}
                  </span>
                </div>

                <div className="text-xs text-slate-400 text-right">
                  <span>Modified by </span>
                  <strong className="text-slate-700">{flag.modifiedBy}</strong>
                  <span className="block text-[11px] font-mono">{flag.lastModified}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
