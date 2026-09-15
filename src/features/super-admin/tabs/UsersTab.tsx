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
      disable: "Disable this user account? They will lose access immediately.",
      enable: "Re-enable this user account?",
      set_role: `Change user role to "${extra?.role}"?`,
      reset_password: "Generate a manual password-recovery link for this user?",
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
        setNotice({ kind: "ok", text: "Recovery link generated successfully. Forward it directly to the customer." });
      } else {
        setNotice({ kind: "ok", text: `User ${op === "set_role" ? `role updated to ${extra?.role}` : op === "disable" ? "disabled" : "enabled"} successfully.` });
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
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by email or display name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load({ page: 1 }); }}
            className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1 font-medium text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); }}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <select
            value={active}
            onChange={(e) => { setActive(e.target.value); }}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Disabled Only</option>
          </select>

          <select
            value={restaurantId}
            onChange={(e) => { setRestaurantId(e.target.value); }}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none max-w-48 truncate"
          >
            <option value="">All Tenant Cafés</option>
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => load({ page: 1 })}
            className="px-3.5 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold text-xs cursor-pointer shadow-sm"
          >
            Filter
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            notice.kind === "ok"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {resetLink && (
        <div className="bg-violet-50 border border-violet-200 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-900">
              Manual Password Recovery Link for <span className="font-mono">{resetLink.email}</span>
            </span>
            <span className="text-[10px] text-violet-600 font-medium">Valid for 24 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={resetLink.link}
              className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 select-all"
            />
            <button
              type="button"
              onClick={copyLink}
              className="px-3 py-1.5 rounded-lg bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold text-xs cursor-pointer"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setResetLink(null)}
              className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 font-black text-sm text-slate-900 flex items-center justify-between">
          <span>Global User Accounts ({total})</span>
          <span className="text-xs font-medium text-slate-400">Page {page} of {totalPages}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">User</th>
                <th className="p-4">Assigned Café</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const busy = actingId === r.id;
                const isOwner = r.role === "owner";
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 break-all">{r.email}</div>
                      {r.display_name && <div className="text-slate-500 text-[10px] mt-0.5">{r.display_name}</div>}
                    </td>
                    <td className="p-4">
                      {r.restaurant_name ? (
                        <>
                          <div className="font-bold text-slate-900">{r.restaurant_name}</div>
                          <div className="text-slate-400 text-[10px] font-mono">/c/{r.restaurant_slug}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        r.role === "super_admin"
                          ? "bg-violet-50 text-[#5738F5] border-violet-200"
                          : r.role === "owner"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {r.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                        {r.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runOp(r.id, r.active ? "disable" : "enable")}
                        className={`px-2.5 py-1.5 rounded-lg disabled:opacity-40 text-xs font-bold cursor-pointer transition-all ${
                          r.active
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {r.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runOp(r.id, "set_role", { role: isOwner ? "staff" : "owner" })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 text-xs font-bold cursor-pointer"
                      >
                        Make {isOwner ? "staff" : "owner"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runOp(r.id, "reset_password")}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-[#5738F5] border border-violet-200 disabled:opacity-40 text-xs font-bold cursor-pointer"
                      >
                        Reset PW
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    {loadError || "No users match the selected filters."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    Loading users…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong>{rows.length}</strong> of <strong>{total}</strong> users
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
