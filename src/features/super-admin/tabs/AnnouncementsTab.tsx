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
      flash("ok", "Announcement published");
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
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">New announcement</h2>
        <p className="text-slate-500 dark:text-stone-400 mt-1 text-sm">
          Platform-wide notices by plan segment. Every publish/delete is audit-logged.
        </p>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Scheduled maintenance on Sunday…"
              className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Body (max 2000 chars)</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Audience</label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value as (typeof PLANS)[number])}
                className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Starts at</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Ends at (optional)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {saving ? "Publishing…" : "Publish announcement"}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 font-bold text-sm text-slate-700 dark:text-stone-300">
          📣 Announcements ({rows.length})
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading announcements…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">No announcements yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-stone-800/60">
            {rows.map((a) => (
              <li key={a.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{a.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {a.target_plan}
                    </span>
                  </div>
                  {a.body && <p className="text-xs text-slate-500 dark:text-stone-400 mt-1">{a.body}</p>}
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    {new Date(a.starts_at).toLocaleString("en-IN")}
                    {a.ends_at ? ` → ${new Date(a.ends_at).toLocaleString("en-IN")}` : " → ongoing"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-xs cursor-pointer shrink-0"
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
