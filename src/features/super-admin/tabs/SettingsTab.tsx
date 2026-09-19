// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import { FeatureFlagsTab } from "./FeatureFlagsTab";
import { BroadcastTab } from "./BroadcastTab";
import { AnnouncementsTab } from "./AnnouncementsTab";
import { ApiKeysTab } from "./ApiKeysTab";

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
  const { tab } = useSuperAdmin();
  const initialSection =
    tab === "feature-flags" ? "flags" :
    tab === "broadcast" ? "broadcast" :
    tab === "announcements" ? "announcements" :
    tab === "api-keys" ? "keys" : "engine";

  const [activeSection, setActiveSection] = useState<"engine" | "flags" | "broadcast" | "announcements" | "keys">(initialSection);
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
          setLoadError("Could not load platform settings — displaying defaults.");
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
      setNotice(`Successfully saved ${key}.`);
    } catch {
      setNotice(`Could not save ${key}.`);
    } finally {
      setSavingKey(null);
    }
  }

  if (!settings) {
    return (
      <div className="max-w-3xl space-y-6">
        <p className="text-xs text-slate-500 font-medium">{loadError ?? "Loading platform settings…"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Segmented Settings Sub-Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveSection("engine")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "engine"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Engine & Core
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("flags")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "flags"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Feature Flags
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("broadcast")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "broadcast"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Broadcast Banners
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("announcements")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "announcements"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Announcements
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("keys")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "keys"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          API Keys
        </button>
      </div>

      {activeSection === "flags" && <FeatureFlagsTab />}
      {activeSection === "broadcast" && <BroadcastTab />}
      {activeSection === "announcements" && <AnnouncementsTab />}
      {activeSection === "keys" && <ApiKeysTab />}

      {activeSection === "engine" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Platform Core Settings</h3>
              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
                System Control
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Default evaluation trial duration, subscription tier rates, public onboarding toggles, and global maintenance lock.
            </p>
          </div>

          {loadError && <p className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">{loadError}</p>}
          {notice && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{notice}</p>}

          {/* Trial Length */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="font-bold text-xs text-slate-900">Default Free Trial Duration</div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Evaluation days automatically granted to newly registered cafés</p>
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
                className="w-18 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 text-center font-mono font-bold"
              />
              <span className="text-xs text-slate-500 font-semibold">days</span>
              <button
                type="button"
                onClick={() => postSettings("trial_days", { trial_days: Math.max(1, Math.min(90, Math.round(settings.trial_days.days))) })}
                disabled={savingKey === "trial_days"}
                className="px-3.5 py-1.5 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm ml-2"
              >
                {savingKey === "trial_days" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <div className="font-bold text-xs text-slate-900">Subscription Pricing (INR)</div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Standard recurring subscription billing defaults</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Monthly Rate (₹)
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
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Annual Rate (₹)
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
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold"
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
              className="w-full py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
            >
              {savingKey === "pricing" ? "Saving…" : "Save Pricing Defaults"}
            </button>
          </div>

          {/* Self-Serve Signups */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="font-bold text-xs text-slate-900">Self-Serve Onboarding</div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Allow new café owners to register via the public marketing landing pages
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const next = !settings.signups_open.enabled;
                setSettings((prev) => (prev ? { ...prev, signups_open: { enabled: next } } : prev));
                await postSettings("signups_open", { signups_open: { enabled: next } });
              }}
              disabled={savingKey === "signups_open"}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                settings.signups_open.enabled ? "bg-[#5738F5]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.signups_open.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Maintenance Mode */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">Emergency Maintenance Lock</div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Block tenant logins and menu access with an operational maintenance message
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          maintenance: { ...prev.maintenance, enabled: !prev.maintenance.enabled },
                        }
                      : prev
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.maintenance.enabled ? "bg-rose-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenance.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <label className="space-y-1 block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Broadcast Maintenance Message
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
                placeholder="We are upgrading systems. Estimated return: 15 minutes…"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#5738F5]"
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
              className="w-full py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
            >
              {savingKey === "maintenance" ? "Saving…" : "Save Maintenance Configuration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
