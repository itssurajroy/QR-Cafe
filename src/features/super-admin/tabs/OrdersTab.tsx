// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  total_paise: number;
  created_at: string;
  customer_name: string | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  restaurant_slug: string | null;
  item_count: number;
};

type CafeOption = { id: string; name: string; slug: string };

const STATUSES = ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled", "rejected"];

function paiseToRupees(paise: number | null | undefined) {
  return `₹${Math.round((paise ?? 0) / 100).toLocaleString("en-IN")}`;
}

export function OrdersTab() {
  const { tab } = useSuperAdmin();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async (opts?: { page?: number; q?: string; status?: string; restaurantId?: string; from?: string; to?: string }) => {
    const p = opts?.page ?? page;
    const params = new URLSearchParams({ page: String(p) });
    const qq = opts?.q ?? q;
    const ss = opts?.status ?? status;
    const cc = opts?.restaurantId ?? restaurantId;
    const ff = opts?.from ?? from;
    const tt = opts?.to ?? to;
    if (qq.trim()) params.set("q", qq.trim());
    if (ss) params.set("status", ss);
    if (cc) params.set("restaurant_id", cc);
    if (ff) params.set("from", ff);
    if (tt) params.set("to", tt);
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/super/orders?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load orders");
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? p);
      setTotalPages(data.totalPages ?? 1);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load orders");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, status, restaurantId, from, to]);

  useEffect(() => {
    load({ page: 1 });
    fetch("/api/super/tenants?page=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.rows)) {
          setCafes(d.rows.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getStatusBadge(st: string) {
    switch (st) {
      case "completed":
      case "served":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "preparing":
      case "ready":
      case "confirmed":
        return "bg-violet-50 text-[#5738F5] border-violet-200";
      case "cancelled":
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500"></span>
          <span>Global Cross-Tenant Order Telemetry (Read-only administrative explorer)</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Total volume: {total} records</span>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by order # or guest name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load({ page: 1 }); }}
              className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1 font-medium text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); }}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={restaurantId}
              onChange={(e) => { setRestaurantId(e.target.value); }}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none max-w-44 truncate"
            >
              <option value="">All Tenant Cafés</option>
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-medium focus:outline-none"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-medium focus:outline-none"
            />

            <button
              type="button"
              onClick={() => load({ page: 1 })}
              className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 font-black text-sm text-slate-900 flex items-center justify-between">
          <span>Global Orders Stream ({total})</span>
          <span className="text-xs font-medium text-slate-400">Page {page} of {totalPages}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">Order #</th>
                <th className="p-4">Tenant Café</th>
                <th className="p-4">Kitchen Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Created Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-900">#{o.order_number}</div>
                    {o.customer_name && <div className="text-slate-500 text-[10px] mt-0.5">{o.customer_name}</div>}
                  </td>
                  <td className="p-4">
                    {o.restaurant_name ? (
                      <>
                        <div className="font-bold text-slate-900">{o.restaurant_name}</div>
                        <div className="text-slate-400 text-[10px] font-mono">/c/{o.restaurant_slug}</div>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    <span className="font-semibold">{o.payment_status ?? "—"}</span>
                    {o.payment_method && <span className="text-[10px] text-slate-400 ml-1 font-mono">({o.payment_method})</span>}
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-700">{o.item_count} items</td>
                  <td className="p-4 font-mono font-bold text-slate-900">
                    {paiseToRupees(o.total_paise)}
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-[11px]">
                    {new Date(o.created_at).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    {loadError || "No orders match the selected filters."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    Loading cross-tenant orders…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong>{rows.length}</strong> of <strong>{total}</strong> orders
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => load({ page: page - 1 })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-medium shadow-sm"
            >
              &larr; Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => load({ page: page + 1 })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-medium shadow-sm"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
