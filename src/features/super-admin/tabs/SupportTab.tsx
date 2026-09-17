// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tier?: string | null;
  trial_ends_at?: string | null;
  owner_email?: string | null;
};

type NoteLine = { at?: string; by?: string; note?: string; raw: string };

const PRIORITY_PREFIX = "[PRIORITY] ";

function parseNotes(internalNotes: string): { priority: boolean; lines: NoteLine[] } {
  const priority = internalNotes.startsWith(PRIORITY_PREFIX);
  const body = priority ? internalNotes.slice(PRIORITY_PREFIX.length) : internalNotes;
  const lines: NoteLine[] = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        const p = JSON.parse(l);
        if (p && typeof p === "object") return { at: p.at, by: p.by, note: p.note ?? l, raw: l };
      } catch {
        // legacy plain-text line
      }
      return { raw: l, note: l };
    })
    .reverse(); // newest first
  return { priority, lines };
}

export function SupportTab() {
  const { tab, flash } = useSuperAdmin();
  const [query, setQuery] = React.useState("");
  const [rows, setRows] = React.useState<TenantRow[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<TenantRow | null>(null);
  const [internalNotes, setInternalNotes] = React.useState("");
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [noteInput, setNoteInput] = React.useState("");
  const [lastImpersonation, setLastImpersonation] = React.useState<{ expires_at: string } | null>(null);

  const { priority, lines } = React.useMemo(() => parseNotes(internalNotes), [internalNotes]);

  const runSearch = async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/super/tenants?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.ok) setRows(data.rows ?? []);
      else flash("err", data.error || "Search failed");
    } catch {
      flash("err", "Network error searching tenants");
    } finally {
      setSearching(false);
    }
  };

  const openTenant = async (t: TenantRow) => {
    setSelected(t);
    setLastImpersonation(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/super/tenant?cafeId=${t.id}`);
      const data = await res.json();
      if (data.ok) setInternalNotes(data.tenant?.internal_notes ?? "");
      else setInternalNotes("");
    } catch {
      setInternalNotes("");
    } finally {
      setLoadingDetail(false);
    }
  };

  const supportOp = async (op: "resend_welcome" | "resend_trial_ending" | "toggle_priority" | "add_note", extra?: Record<string, unknown>) => {
    if (!selected || busy) return;
    setBusy(op);
    try {
      const res = await fetch("/api/super/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, cafeId: selected.id, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (op === "resend_welcome" || op === "resend_trial_ending") {
        flash(data.sent ? "ok" : "err", data.sent ? "Email resent" : `Email not sent (${data.skipped || "unknown"})`);
      } else {
        if (typeof data.internal_notes === "string") setInternalNotes(data.internal_notes);
        if (op === "add_note") setNoteInput("");
        flash("ok", op === "toggle_priority" ? (data.priority ? "Marked priority" : "Priority cleared") : "Note added");
      }
    } catch (err: unknown) {
      flash("err", err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const handleImpersonate = async () => {
    if (!selected || busy) return;
    setBusy("impersonate");
    try {
      const res = await fetch("/api/super/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId: selected.id }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        if (data.expires_at) setLastImpersonation({ expires_at: data.expires_at });
        window.open(data.url, "_blank");
      } else {
        flash("err", data.error || "Failed to impersonate");
      }
    } catch {
      flash("err", "Network error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Search Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">Support Desk & Tenant Troubleshooting</h2>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
              Diagnostic
            </span>
          </div>
          <p className="text-slate-500 mt-0.5 text-xs font-medium">
            Look up any café tenant to view internal incident notes, trigger transactional emails, or open an authenticated impersonation session.
          </p>
        </div>

        <div className="flex gap-2.5">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(query); }}
              placeholder="Search tenant by café name or slug…"
              className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1 font-medium text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={searching}
            className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {rows.length > 0 && (
          <ul className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden mt-3">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => openTenant(r)}
                  className={`w-full text-left px-4 py-3 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    selected?.id === r.id ? "bg-violet-50 text-[#5738F5]" : "hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900">{r.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-400">/c/{r.slug}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    {r.plan}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Tenant Details & Actions */}
      {selected && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {selected.name} <span className="font-mono text-xs font-normal text-slate-400">/c/{selected.slug}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Owner Email: <span className="font-mono text-slate-700">{selected.owner_email ?? "Not configured"}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => supportOp("toggle_priority")}
              disabled={busy !== null}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer disabled:opacity-50 transition-all ${
                priority
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {priority ? "★ High Priority Ticket" : "☆ Mark As Priority"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleImpersonate}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-50 text-[#5738F5] border border-violet-200 hover:bg-violet-100 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <span>🕵️</span>
              <span>Impersonate Café Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => supportOp("resend_welcome")}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <span>✉️</span>
              <span>Resend Welcome Email</span>
            </button>
            <button
              type="button"
              onClick={() => supportOp("resend_trial_ending")}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <span>⏰</span>
              <span>Resend Trial-Ending Notice</span>
            </button>
          </div>

          {lastImpersonation && (
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs font-medium text-violet-800">
              Impersonation session established. Token expires at {new Date(lastImpersonation.expires_at).toLocaleTimeString("en-IN")}.
            </div>
          )}

          {/* Internal Notes Section */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">Internal Incident Log (Append-only record)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={500}
                placeholder="e.g. Spoke with café manager regarding menu image uploads, issue resolved…"
                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] font-medium"
              />
              <button
                type="button"
                onClick={() => supportOp("add_note", { note: noteInput.trim() })}
                disabled={busy !== null || !noteInput.trim()}
                className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Add Note
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Timeline History (Newest First)</div>
            {loadingDetail ? (
              <div className="text-xs text-slate-400">Loading timeline records…</div>
            ) : lines.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No internal incident notes recorded for this café.</div>
            ) : (
              <ul className="space-y-2">
                {lines.map((l, i) => (
                  <li key={`${l.at ?? i}-${i}`} className="text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                    <div className="text-slate-800 font-medium">{l.note}</div>
                    {(l.at || l.by) && (
                      <div className="font-mono text-[10px] text-slate-400 mt-1.5 flex items-center gap-2">
                        {l.at && <span>{new Date(l.at).toLocaleString("en-IN")}</span>}
                        {l.by && <span>• Admin: {String(l.by).slice(0, 8)}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
