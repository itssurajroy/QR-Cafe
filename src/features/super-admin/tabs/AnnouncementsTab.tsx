// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type Announcement = {
  id: string;
  title: string;
  body: string;
  target_plan: "all" | "trial" | "active" | "suspended";
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

const PLANS = ["all", "trial", "active", "suspended"] as const;

export function AnnouncementsTab() {
  const { tab, flash } = useSuperAdmin();
  const [rows, setRows] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [targetPlan, setTargetPlan] = React.useState<(typeof PLANS)[number]>("all");
  const [startsAt, setStartsAt] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super/announcements");
      const data = await res.json();
      if (data.ok) setRows(data.announcements ?? []);
    } catch {
      flash("err", "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  React.useEffect(() => {
    if (tab !== "announcements") return;
    fetch("/api/super/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setRows(data.announcements ?? []);
      })
      .catch(() => flash("err", "Failed to load announcements"))
      .finally(() => setLoading(false));
  }, [tab, flash]);

  if (tab !== "announcements") return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      flash("err", "Title must be at least 3 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/super/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body,
          target_plan: targetPlan,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setTitle("");
      setBody("");
      setEndsAt("");
      flash("ok", "Announcement published successfully");
      load();
    } catch (err: unknown) {
      flash("err", err instanceof Error ? err.message : "Failed to publish announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch("/api/super/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      flash("ok", "Announcement deleted");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      flash("err", "Failed to delete announcement");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Create Announcement Card */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">Create Targeted Platform Notice</h2>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
              Segmented
            </span>
          </div>
          <p className="text-slate-500 mt-0.5 text-xs font-medium">
            Broadcast platform-wide notifications targeted by café plan segment (Trial, Active, or All).
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g., Upcoming Payment Gateway Maintenance Window"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notice Description</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              placeholder="Provide context and instructions for the restaurant operators…"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] resize-none font-medium"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audience Segment</label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value as (typeof PLANS)[number])}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p === "all" ? "All Cafés (Global)" : `Plan: ${p}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time (Optional)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {saving ? "Publishing…" : "Publish Announcement"}
            </button>
          </div>
        </form>
      </div>

      {/* Announcements List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 font-black text-sm text-slate-900 flex items-center justify-between">
          <span>Active & Scheduled Announcements ({rows.length})</span>
        </div>
        {loading ? (
          <div className="p-8 text-xs text-slate-400 text-center font-medium">Loading announcements…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-xs text-slate-400 text-center font-medium">No announcements published yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((a) => (
              <li key={a.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{a.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 text-[#5738F5] border border-violet-200">
                      Segment: {a.target_plan}
                    </span>
                  </div>
                  {a.body && <p className="text-xs text-slate-600 font-medium">{a.body}</p>}
                  <p className="text-[11px] font-mono text-slate-400">
                    {new Date(a.starts_at).toLocaleString("en-IN")}
                    {a.ends_at ? ` → ${new Date(a.ends_at).toLocaleString("en-IN")}` : " → Ongoing"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs cursor-pointer shrink-0 transition-all"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
