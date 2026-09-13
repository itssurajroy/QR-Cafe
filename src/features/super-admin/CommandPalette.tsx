// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSuperAdmin } from "./SuperAdminContext";

type TenantHit = { id: string; name: string; slug: string };

type Action = { id: string; label: string; hint: string; run: () => void };

export function CommandPalette() {
  const ctx = useSuperAdmin();
  const { setTab, openDrawer, setShowNewCafeModal } = ctx;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState<TenantHit[]>([]);
  const [tenantsFailed, setTenantsFailed] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const go = useCallback(
    (tab: string) => {
      setTab(tab);
      setOpen(false);
      setQuery("");
    },
    [setTab],
  );

  const staticActions: Action[] = [
    { id: "new-tenant", label: "New tenant…", hint: "Provision", run: () => { setShowNewCafeModal(true); setOpen(false); setQuery(""); } },
    { id: "go-health", label: "Go to System Health", hint: "Tab", run: () => go("system-health") },
    { id: "go-audit", label: "Go to Audit logs", hint: "Tab", run: () => go("audit") },
    { id: "go-billing", label: "Go to Billing", hint: "Tab", run: () => go("billing") },
  ];

  // Cmd/Ctrl+K toggles the palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open ]);

  // Debounced tenant search; degrades to static actions if the fetch fails.
  useEffect(() => {
    if (!open) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const q = query.trim();
    if (!q) {
      setTenants([]);
      setTenantsFailed(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/super/tenants?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTenants((data.rows ?? []).slice(0, 7));
        setTenantsFailed(false);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setTenants([]);
        setTenantsFailed(true);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open ]);

  const q = query.trim().toLowerCase();
  const matchedActions = staticActions.filter((a) => !q || a.label.toLowerCase().includes(q));
  const matchedTenants = tenants.filter(
    (t) => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
  );

  type Row =
    | { kind: "tenant"; key: string; label: string; sub: string; run: () => void }
    | { kind: "action"; key: string; label: string; sub: string; run: () => void };
  const rows: Row[] = [
    ...matchedTenants.map((t): Row => ({
      kind: "tenant",
      key: `tenant-${t.id}`,
      label: t.name,
      sub: `/c/${t.slug}`,
      run: () => {
        openDrawer(t.id);
        setOpen(false);
        setQuery("");
      },
    })),
    ...matchedActions.map((a): Row => ({ kind: "action", key: a.id, label: a.label, sub: a.hint, run: a.run })),
  ];

  useEffect(() => {
    setCursor(0);
  }, [query ]);

  function onDialogKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (rows.length ? (c + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (rows.length ? (c - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      rows[cursor]?.run();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKey}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search tenants…"
          className="w-full p-4 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none border-b border-slate-200 dark:border-stone-800"
        />
        <div className="max-h-72 overflow-y-auto p-2">
          {rows.length === 0 && (
            <div className="p-4 text-xs text-slate-500 dark:text-stone-400 text-center">
              {tenantsFailed ? "Tenant search unavailable — static actions only." : "No matches. Try another search."}
            </div>
          )}
          {rows.map((r, i) => (
            <button
              key={r.key}
              type="button"
              onMouseEnter={() => setCursor(i)}
              onClick={() => r.run()}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                i === cursor
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span>{r.kind === "tenant" ? "🏢" : "⚡"}</span>
                <span className="truncate">{r.label}</span>
              </span>
              <span className={`text-xs font-mono ${i === cursor ? "text-white/70" : "text-slate-400"}`}>{r.sub}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-slate-200 dark:border-stone-800 text-xs text-slate-400 dark:text-stone-500 flex gap-3">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
