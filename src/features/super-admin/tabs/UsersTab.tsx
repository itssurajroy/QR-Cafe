// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type UserRow = {
  id: string;
  email: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  restaurant_slug: string | null;
  role: string;
  display_name: string | null;
  active: boolean;
};

type CafeOption = { id: string; name: string; slug: string };

export function UsersTab() {
  const { tab } = useSuperAdmin();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [resetLink, setResetLink] = useState<{ email: string; link: string } | null>(null);

  const load = useCallback(async (opts?: { page?: number; q?: string; role?: string; active?: string; restaurantId?: string }) => {
    const p = opts?.page ?? page;
    const params = new URLSearchParams({ page: String(p) });
    const qq = opts?.q ?? q;
    const rr = opts?.role ?? role;
    const aa = opts?.active ?? active;
    const cc = opts?.restaurantId ?? restaurantId;
    if (qq.trim()) params.set("q", qq.trim());
    if (rr) params.set("role", rr);
    if (aa) params.set("active", aa);
    if (cc) params.set("restaurant_id", cc);
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/super/users?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load users");
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? p);
      setTotalPages(data.totalPages ?? 1);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load users");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, role, active, restaurantId]);

  useEffect(() => {
    if (tab !== "users") return;
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

  if (tab !== "users") return null;

  async function runOp(user_id: string, op: "disable" | "enable" | "set_role" | "reset_password", extra?: { role?: string }) {
    if (actingId) return;
    const labels: Record<string, string> = {
      disable: "Disable this user? They will be locked out immediately.",
      enable: "Re-enable this user?",
      set_role: `Change role to "${extra?.role}"?`,
      reset_password: "Generate a password-recovery link for this user?",
    };
    if (!confirm(labels[op])) return;
    setActingId(user_id);
    setNotice(null);
    setResetLink(null);
    try {
      const res = await fetch("/api/super/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, user_id, ...(extra?.role ? { role: extra.role } : {}) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Operation failed");
      if (op === "reset_password" && data.link) {
        const target = rows.find((r) => r.id === user_id);
        setResetLink({ email: target?.email ?? "", link: data.link });
        setNotice({ kind: "ok", text: "Recovery link generated — forward it to the user. Nothing was emailed." });
      } else {
        setNotice({ kind: "ok", text: `User ${op === "set_role" ? `role set to ${extra?.role}` : op === "disable" ? "disabled" : "enabled"}.` });
      }
      await load();
    } catch (e: any) {
      setNotice({ kind: "err", text: e?.message || "Operation failed" });
    } finally {
      setActingId(null);
    }
  }

  function copyLink() {
    if (!resetLink) return;
    navigator.clipboard?.writeText(resetLink.link).catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by display name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load({ page: 1 }); }}
            className="bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none flex-1"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); }}
            className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={active}
            onChange={(e) => { setActive(e.target.value); }}
            className="bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
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
          <button
            type="button"
            onClick={() => load({ page: 1 })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
          >
            Search
          </button>
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

      {resetLink && (
        <div className="px-4 py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-xs space-y-2">
          <div className="font-bold text-indigo-700">Recovery link for {resetLink.email || "user"} (forward manually — nothing was emailed):</div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={resetLink.link}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={copyLink}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setResetLink(null)}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 font-black text-sm text-slate-900 dark:text-white">
          Global Users ({total})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/50 text-slate-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Café</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800/60">
              {rows.map((r) => {
                const busy = actingId === r.id;
                const isOwner = r.role === "owner";
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white break-all">{r.email}</div>
                      {r.display_name && <div className="text-slate-500 text-[10px]">{r.display_name}</div>}
                    </td>
                    <td className="p-4">
                      {r.restaurant_name ? (
                        <>
                          <div className="font-bold text-slate-900 dark:text-white">{r.restaurant_name}</div>
                          <div className="text-slate-500 text-[10px]">/c/{r.restaurant_slug}</div>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300">
                        {r.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          r.active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                        }`}
                      >
                        {r.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runOp(r.id, r.active ? "disable" : "enable")}
                        className={`px-3 py-1.5 rounded-lg disabled:opacity-40 text-white font-bold cursor-pointer ${
                          r.active ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
                        }`}
                      >
                        {r.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runOp(r.id, "set_role", { role: isOwner ? "staff" : "owner" })}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 disabled:opacity-40 border border-slate-300 dark:border-stone-700 font-bold cursor-pointer"
                      >
                        Make {isOwner ? "staff" : "owner"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runOp(r.id, "reset_password")}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold cursor-pointer"
                      >
                        Reset password
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    {loadError || "No users match the selected filters."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-stone-500">
                    Loading users…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950/40 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-stone-400">
            Showing <strong>{rows.length}</strong> of <strong>{total}</strong> users (Page {page} of {totalPages})
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
