// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type BillingRow = {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  mrr_cents?: number;
};

type BillingEvent = {
  id: string;
  created_at: string;
  restaurant_id: string | null;
  provider: string;
  event_type: string;
  status: string;
  amount_paise: number | null;
  payload: Record<string, unknown>;
};

function paiseToRupees(paise: number | null | undefined) {
  return `₹${((paise ?? 0) / 100).toLocaleString("en-IN")}`;
}

export function BillingTab() {
  const { tab } = useSuperAdmin();
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [mrrPaise, setMrrPaise] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/super/billing");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load billing data");
      setRows(data.rows ?? []);
      setEvents(data.events ?? []);
      setMrrPaise(data.mrr_paise ?? 0);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load billing data");
      setRows([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "billing") load();
  }, [tab, load]);

  if (tab !== "billing") return null;

  const failedEvents = events.filter((e) => e.status === "failed");
  const statusOf = (r: BillingRow) => r.subscription_status ?? r.plan ?? "trial";
  const pastDue = rows.filter((r) => {
    const s = statusOf(r);
    if (s === "expired" || s === "suspended") return true;
    if (s === "trial" && r.trial_ends_at) return new Date(r.trial_ends_at).getTime() < Date.now();
    return false;
  });
  // Failed-payments queue: tenants with a failed webhook event plus past-due tenants.
  const failedIds = new Set(failedEvents.map((e) => e.restaurant_id).filter(Boolean));
  const queue = rows.filter((r) => failedIds.has(r.id) || pastDue.some((p) => p.id === r.id));

  async function transition(restaurant_id: string, to: "active" | "suspended" | "trial", fallbackReason: string) {
    const reason = (window.prompt("Reason for this subscription change (min 5 characters):", fallbackReason) || "").trim();
    if (reason.length < 5) {
      setNotice({ kind: "err", text: "A reason of at least 5 characters is required." });
      return;
    }
    setActingId(restaurant_id + to);
    setNotice(null);
    try {
      const res = await fetch("/api/super/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id, to, reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Transition failed");
      setNotice({ kind: "ok", text: `${data.from} → ${data.to} recorded.` });
      await load();
    } catch (e: any) {
      setNotice({ kind: "err", text: e?.message || "Transition failed" });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Total MRR</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {paiseToRupees(mrrPaise)}<span className="text-sm text-slate-400 font-medium">/mo</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 inline-block px-2 py-1 rounded-md font-bold">
            ₹999 / active subscriber
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Failed Payments</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{failedEvents.length}</div>
          <div className="mt-2 text-xs text-slate-400">Webhook events with status failed</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-stone-400">Past-Due Tenants</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{pastDue.length}</div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">Expired, suspended, or lapsed trial</div>
        </div>
      </div>

      {notice && (
        <div
          className={`px-4 py-3 rounded-2xl border text-xs font-bold ${
            notice.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 font-black text-sm text-slate-900 dark:text-white">
          Failed-Payments Queue ({queue.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/50 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Tenant</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">MRR</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {queue.map((r) => {
                const s = statusOf(r);
                const busy = actingId === r.id + "active" || actingId === r.id + "suspended";
                const terminal = s === "cancelled" || s === "active";
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.name}</div>
                      <div className="text-slate-500 text-[10px]">/c/{r.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                        {s}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {paiseToRupees(typeof r.mrr_cents === "number" ? r.mrr_cents : s === "active" ? 99900 : 0)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        disabled={busy || terminal}
                        onClick={() => transition(r.id, "active", "Payment recovered — subscription extended by super-admin")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold cursor-pointer"
                      >
                        Extend
                      </button>
                      <button
                        type="button"
                        disabled={busy || terminal}
                        onClick={() => transition(r.id, "active", "Reactivated by super-admin after payment review")}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold cursor-pointer"
                      >
                        Activate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && queue.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    {loadError || "No failed payments — queue is clear."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    Loading billing data…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 font-black text-sm text-slate-900 dark:text-white">
          Webhook Events ({events.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/50 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Time</th>
                <th className="p-4 font-bold">Event</th>
                <th className="p-4 font-bold">Provider</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 font-mono text-slate-500 dark:text-stone-400">
                    {new Date(e.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{e.event_type}</td>
                  <td className="p-4 text-slate-500 dark:text-stone-400">{e.provider}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        e.status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                          : "bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                    {paiseToRupees(e.amount_paise)}
                  </td>
                </tr>
              ))}
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    {loadError || "No webhook events recorded yet."}
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
