// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";

type Settings = {
  trial_days: { days: number };
  pricing: { monthly_inr: number; annual_inr: number };
  signups_open: { enabled: boolean };
  maintenance: { enabled: boolean; message: string };
};

const FALLBACK: Settings = {
  trial_days: { days: 14 },
  pricing: { monthly_inr: 999, annual_inr: 9999 },
  signups_open: { enabled: true },
  maintenance: { enabled: false, message: "" },
};

export function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/super/platform");
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (cancelled) return;
        const s = data?.settings ?? {};
        setSettings({
          trial_days: { days: Number(s?.trial_days?.days) || FALLBACK.trial_days.days },
          pricing: {
            monthly_inr: Number(s?.pricing?.monthly_inr) || 0,
            annual_inr: Number(s?.pricing?.annual_inr) || 0,
          },
          signups_open: { enabled: s?.signups_open?.enabled !== false },
          maintenance: {
            enabled: s?.maintenance?.enabled === true,
            message: typeof s?.maintenance?.message === "string" ? s.maintenance.message : "",
          },
        });
      } catch {
        if (!cancelled) {
          setLoadError("Could not load platform settings — showing defaults.");
          setSettings(FALLBACK);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function postSettings(key: string, body: Record<string, unknown>) {
    setSavingKey(key);
    setNotice(null);
    try {
      const res = await fetch("/api/super/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      setNotice(`Saved ${key}.`);
    } catch {
      setNotice(`Could not save ${key}.`);
    } finally {
      setSavingKey(null);
    }
  }

  if (!settings) {
    return (
      <div className="max-w-3xl space-y-6">
        <p className="text-xs text-slate-500">{loadError ?? "Loading platform settings…"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-6 shadow-xl">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Platform Settings</h3>
          <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
            Trial defaults, pricing, signups, and maintenance mode stored in `platform_settings`.
          </p>
        </div>
        {loadError && <p className="text-xs font-bold text-amber-600">{loadError}</p>}
        {notice && <p className="text-xs font-bold text-emerald-600">{notice}</p>}

        {/* Trial Length */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">Default Free Trial Duration</div>
            <p className="text-xs text-slate-500 dark:text-stone-400">Days of full access granted upon onboarding (1–90)</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={90}
              value={settings.trial_days.days}
              onChange={(e) =>
                setSettings((prev) => (prev ? { ...prev, trial_days: { days: Number(e.target.value) } } : prev))
              }
              className="w-16 bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white text-center font-mono font-bold"
            />
            <button
              type="button"
              onClick={() => postSettings("trial_days", { trial_days: Math.max(1, Math.min(90, Math.round(settings.trial_days.days))) })}
              disabled={savingKey === "trial_days"}
              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
            >
              {savingKey === "trial_days" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-3">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">Subscription Pricing (INR)</div>
            <p className="text-xs text-slate-500 dark:text-stone-400">Default recurring rates displayed across the platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block">
                Monthly (₹)
              </span>
              <input
                type="number"
                min={0}
                value={settings.pricing.monthly_inr}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, pricing: { ...prev.pricing, monthly_inr: Number(e.target.value) } } : prev
                  )
                }
                className="w-full bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono font-bold"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block">
                Annual (₹)
              </span>
              <input
                type="number"
                min={0}
                value={settings.pricing.annual_inr}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, pricing: { ...prev.pricing, annual_inr: Number(e.target.value) } } : prev
                  )
                }
                className="w-full bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono font-bold"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() =>
              postSettings("pricing", {
                pricing: {
                  monthly_inr: Math.max(0, Math.round(settings.pricing.monthly_inr)),
                  annual_inr: Math.max(0, Math.round(settings.pricing.annual_inr)),
                },
              })
            }
            disabled={savingKey === "pricing"}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
          >
            {savingKey === "pricing" ? "Saving…" : "Update Pricing"}
          </button>
        </div>

        {/* Signups Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">Self-Serve Signups</div>
            <p className="text-xs text-slate-500 dark:text-stone-400">Allow new café owners to register via /onboarding</p>
          </div>
          <button
            type="button"
            disabled={savingKey === "signups_open"}
            onClick={() => {
              const next = !settings.signups_open.enabled;
              setSettings((prev) => (prev ? { ...prev, signups_open: { enabled: next } } : prev));
              postSettings("signups_open", { signups_open: next });
            }}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 ${
              settings.signups_open.enabled
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 dark:bg-stone-800 text-slate-600 dark:text-stone-400"
            }`}
          >
            {settings.signups_open.enabled ? "Enabled ✓" : "Disabled ✕"}
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Maintenance Mode</div>
              <p className="text-xs text-slate-500 dark:text-stone-400">Show a maintenance notice to customers</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) =>
                  prev ? { ...prev, maintenance: { ...prev.maintenance, enabled: !prev.maintenance.enabled } } : prev
                )
              }
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                settings.maintenance.enabled
                  ? "bg-amber-500 text-white"
                  : "bg-slate-200 dark:bg-stone-800 text-slate-600 dark:text-stone-400"
              }`}
            >
              {settings.maintenance.enabled ? "On" : "Off"}
            </button>
          </div>
          <label className="space-y-1 block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 block">
              Maintenance message
            </span>
            <input
              type="text"
              value={settings.maintenance.message}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, maintenance: { ...prev.maintenance, message: e.target.value } } : prev
                )
              }
              maxLength={500}
              placeholder="We are down for scheduled maintenance…"
              className="w-full bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              postSettings("maintenance", {
                maintenance: { enabled: settings.maintenance.enabled, message: settings.maintenance.message },
              })
            }
            disabled={savingKey === "maintenance"}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
          >
            {savingKey === "maintenance" ? "Saving…" : "Save Maintenance Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}
