// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  created_by: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export function ApiKeysTab() {
  const { tab } = useSuperAdmin();
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [degraded, setDegraded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super/api-keys");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load API keys");
      setRows(data.keys ?? []);
      setDegraded(!!data.degraded);
    } catch {
      setRows([]);
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || busy) return;
    setBusy(true);
    setNotice(null);
    setNewSecret(null);
    try {
      const res = await fetch("/api/super/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Create failed");
      setNewSecret(data.key);
      setName("");
      await load();
    } catch (err: any) {
      setNotice({ kind: "err", text: err?.message || "Create failed" });
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string, keyName: string) {
    if (!confirm(`Revoke API key "${keyName}"? Integrations using it will stop working immediately.`)) return;
    try {
      const res = await fetch("/api/super/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Revoke failed");
      await load();
    } catch (err: any) {
      setNotice({ kind: "err", text: err?.message || "Revoke failed" });
    }
  }

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard?.writeText(newSecret).catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <h2 className="text-base font-black text-slate-900 tracking-tight">Platform API Keys</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Scoped secrets for integrations. The raw key is shown once and never stored — only its hash is kept.
        </p>
        {degraded && (
          <p className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Key store unavailable (migration pending) — list hidden until applied.
          </p>
        )}
      </div>

      {notice && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${notice.kind === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {notice.text}
        </div>
      )}

      {newSecret && (
        <div className="bg-violet-50 border border-violet-200 p-4 rounded-2xl space-y-2">
          <div className="text-xs font-black text-violet-900 uppercase tracking-wider">New secret — copy now, it will never be shown again</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-violet-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 break-all select-all">{newSecret}</code>
            <button type="button" onClick={copySecret} className="px-3 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold text-xs cursor-pointer shrink-0">
              Copy
            </button>
            <button type="button" onClick={() => setNewSecret(null)} className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs cursor-pointer shrink-0">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="api-key-name">
            Key name
          </label>
          <input
            id="api-key-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. POS integration, reporting export"
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={busy || name.trim().length < 2}
          className="px-4 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-sm shrink-0"
        >
          {busy ? "Creating…" : "Create Key"}
        </button>
      </form>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">Name</th>
                <th className="p-4">Prefix</th>
                <th className="p-4">Tenant Scope</th>
                <th className="p-4">Last Used</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{k.name}</td>
                  <td className="p-4 font-mono text-slate-600">{k.key_prefix}…</td>
                  <td className="p-4 text-slate-600">{k.restaurant_name || <span className="text-slate-400 italic">Platform-wide</span>}</td>
                  <td className="p-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${k.revoked_at ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${k.revoked_at ? "bg-slate-400" : "bg-emerald-500"}`}></span>
                      {k.revoked_at ? "Revoked" : "Active"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {!k.revoked_at && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id, k.name)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    No API keys yet. Create one above for integrations that need platform access.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    Loading keys…
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
