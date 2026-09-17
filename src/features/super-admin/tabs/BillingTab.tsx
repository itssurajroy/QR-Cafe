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
  return `₹${Math.round((paise ?? 0) / 100).toLocaleString("en-IN")}`;
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
    load();
  }, [load]);

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
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total MRR Run-Rate</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
              Recurring
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3 font-mono tracking-tight">
            {paiseToRupees(mrrPaise)}<span className="text-sm text-slate-400 font-sans font-medium">/mo</span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ₹999 / active monthly subscriber
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed Payment Events</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
              failedEvents.length > 0
                ? "bg-rose-50 text-rose-700 border-rose-100"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              Webhooks
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3 font-mono tracking-tight">{failedEvents.length}</div>
          <div className="mt-3 text-xs text-slate-400 font-medium">Webhook events marked failed</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past-Due Tenants</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
              pastDue.length > 0
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              Requires Review
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3 font-mono tracking-tight">{pastDue.length}</div>
          <div className="mt-3 text-xs text-amber-600 font-medium">Expired, suspended, or lapsed trial</div>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            notice.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Failed-Payments Queue */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 font-black text-sm text-slate-900 flex items-center justify-between">
          <span>Failed-Payments & Recovery Queue ({queue.length})</span>
          <button
            type="button"
            onClick={load}
            className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer"
          >
            Refresh Queue
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">Tenant Café</th>
                <th className="p-4">Subscription Status</th>
                <th className="p-4">MRR Value</th>
                <th className="p-4 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((r) => {
                const s = statusOf(r);
                const busy = actingId === r.id + "active" || actingId === r.id + "suspended";
                const terminal = s === "cancelled" || s === "active";
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-slate-400 text-[10px] font-mono mt-0.5">/c/{r.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        {s}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {paiseToRupees(typeof r.mrr_cents === "number" ? r.mrr_cents : s === "active" ? 99900 : 0)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        disabled={busy || terminal}
                        onClick={() => transition(r.id, "active", "Payment recovered — subscription extended by super-admin")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                      >
                        Recover / Activate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && queue.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                    {loadError || "No delinquent subscriptions — payment queue is clear."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                    Loading billing queue…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Events */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 font-black text-sm text-slate-900">
          Recent Webhook Events ({events.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Gateway Provider</th>
                <th className="p-4">Status</th>
                <th className="p-4 font-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 font-bold text-slate-900 font-sans">{e.event_type}</td>
                  <td className="p-4 text-slate-500 uppercase tracking-wider text-[10px] font-bold">{e.provider}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        e.status === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {paiseToRupees(e.amount_paise)}
                  </td>
                </tr>
              ))}
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-sans font-medium">
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
