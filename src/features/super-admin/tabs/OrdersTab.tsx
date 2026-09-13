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
  return `₹${((paise ?? 0) / 100).toLocaleString("en-IN")}`;
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
    if (tab !== "orders") return;
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
  }, [tab]);

  if (tab !== "orders") return null;

  return (
    <div className="space-y-6">
      <div className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/40 text-xs font-bold text-slate-500 dark:text-stone-400">
        Read-only explorer — orders cannot be changed from here.
      </div>

      <div className="flex flex-col gap-3 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load({ page: 1 }); }}
              className="bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none flex-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); }}
              className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={restaurantId}
              onChange={(e) => { setRestaurantId(e.target.value); }}
              className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none max-w-48"
            >
              <option value="">All Cafés</option>
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (/c/{c.slug})</option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => load({ page: 1 })}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 font-black text-sm text-slate-900 dark:text-white">
          Cross-Tenant Orders ({total})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/50 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Order</th>
                <th className="p-4 font-bold">Café</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Payment</th>
                <th className="p-4 font-bold">Items</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{o.order_number}</div>
                    {o.customer_name && <div className="text-slate-500 text-[10px]">{o.customer_name}</div>}
                  </td>
                  <td className="p-4">
                    {o.restaurant_name ? (
                      <>
                        <div className="font-bold text-slate-900 dark:text-white">{o.restaurant_name}</div>
                        <div className="text-slate-500 text-[10px]">/c/{o.restaurant_slug}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-stone-400">
                    {o.payment_status ?? "—"}
                    {o.payment_method && <span className="text-[10px]"> · {o.payment_method}</span>}
                  </td>
                  <td className="p-4 font-mono text-slate-700 dark:text-stone-300">{o.item_count}</td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                    {paiseToRupees(o.total_paise)}
                  </td>
                  <td className="p-4 font-mono text-slate-500 dark:text-stone-400">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    {loadError || "No orders match the selected filters."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    Loading orders…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/40 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-stone-400">
            Showing <strong>{rows.length}</strong> of <strong>{total}</strong> orders (Page {page} of {totalPages})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => load({ page: page - 1 })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
            >
              &larr; Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => load({ page: page + 1 })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
