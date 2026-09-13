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

  if (tab !== "support") return null;

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
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Support tools</h2>
        <p className="text-slate-500 dark:text-stone-400 mt-1 text-sm">
          Search a tenant, then impersonate, resend emails, or manage internal notes. Every action is audit-logged.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(query); }}
            placeholder="Search by café name or slug…"
            className="flex-1 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={searching}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        {rows.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-stone-800/60 border border-slate-200 dark:border-stone-800 rounded-xl overflow-hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => openTenant(r)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    selected?.id === r.id ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-slate-50 dark:hover:bg-stone-800/40"
                  }`}
                >
                  <span>
                    <span className="font-bold text-slate-900 dark:text-white">{r.name}</span>
                    <span className="ml-2 font-mono text-xs text-slate-400">/c/{r.slug}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500">{r.plan}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {selected.name} <span className="font-mono font-normal text-slate-400">/c/{selected.slug}</span>
              </h3>
              <p className="text-xs text-slate-500">Owner: {selected.owner_email ?? "—"}</p>
            </div>
            <button
              type="button"
              onClick={() => supportOp("toggle_priority")}
              disabled={busy !== null}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer disabled:opacity-50 ${
                priority
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-500"
                  : "bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 border-slate-300 dark:border-stone-700"
              }`}
            >
              {priority ? "★ Priority" : "☆ Mark priority"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImpersonate}
              disabled={busy !== null}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              🕵️ Impersonate
            </button>
            <button
              type="button"
              onClick={() => supportOp("resend_welcome")}
              disabled={busy !== null}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              ✉️ Resend welcome
            </button>
            <button
              type="button"
              onClick={() => supportOp("resend_trial_ending")}
              disabled={busy !== null}
              className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              ✉️ Resend trial-ending
            </button>
          </div>
          {lastImpersonation && (
            <p className="text-xs text-slate-500">
              Impersonation link opened — session expires at {new Date(lastImpersonation.expires_at).toLocaleString("en-IN")}.
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Add internal note (append-only)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={500}
                placeholder="e.g. Called owner, billing resolved…"
                className="flex-1 bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => supportOp("add_note", { note: noteInput.trim() })}
                disabled={busy !== null || !noteInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-600 dark:text-stone-400 mb-2">Notes timeline (newest first)</div>
            {loadingDetail ? (
              <div className="text-xs text-slate-500">Loading notes…</div>
            ) : lines.length === 0 ? (
              <div className="text-xs text-slate-400">No notes yet.</div>
            ) : (
              <ul className="space-y-2">
                {lines.map((l, i) => (
                  <li key={`${l.at ?? i}-${i}`} className="text-xs bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-xl px-3 py-2">
                    <div className="text-slate-800 dark:text-stone-200">{l.note}</div>
                    {(l.at || l.by) && (
                      <div className="font-mono text-slate-400 mt-1">
                        {l.at ? new Date(l.at).toLocaleString("en-IN") : ""}{l.by ? ` · ${String(l.by).slice(0, 8)}` : ""}
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
