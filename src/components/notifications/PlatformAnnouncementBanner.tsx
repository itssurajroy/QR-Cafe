// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  type?: string;
  target_plan: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

const DISMISSED_KEY = "qrslice_dismissed_announcement_banner_ids";

export function PlatformAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }

    async function fetchAnnouncements() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.ok && Array.isArray(data.notifications)) {
          setAnnouncements(data.notifications);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30_000);
    return () => clearInterval(interval);
  }, []);

  const activeVisible = announcements.filter((a) => !dismissedIds.has(a.id));

  if (loading || activeVisible.length === 0) {
    return null;
  }

  const latest = activeVisible[0];

  const handleDismiss = (id: string) => {
    const next = new Set(dismissedIds);
    next.add(id);
    setDismissedIds(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  const isRose = latest.type === "danger" || latest.type === "rose" || latest.type === "critical";
  const isAmber = latest.type === "warning" || latest.type === "amber";
  const isSuccess = latest.type === "success";

  const containerStyle = isRose
    ? "bg-rose-50 border border-rose-300 text-rose-950 shadow-sm"
    : isAmber
    ? "bg-amber-50 border border-amber-300 text-amber-950 shadow-sm"
    : isSuccess
    ? "bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-sm"
    : "bg-gradient-to-r from-[#5738F5] via-indigo-600 to-purple-700 text-white shadow-sm border border-violet-400/20";

  const iconEmoji = isRose ? "🚨" : isAmber ? "⚠️" : isSuccess ? "✨" : "📢";

  const badgeStyle = isRose
    ? "bg-rose-600 text-white"
    : isAmber
    ? "bg-amber-600 text-white"
    : isSuccess
    ? "bg-emerald-600 text-white"
    : "bg-white/20 text-violet-100";

  const titleColor = isRose ? "text-rose-950" : isAmber ? "text-amber-950" : isSuccess ? "text-emerald-950" : "text-white";
  const bodyColor = isRose ? "text-rose-800" : isAmber ? "text-amber-800" : isSuccess ? "text-emerald-800" : "text-violet-100/90";
  const dismissBtnStyle = isRose
    ? "text-rose-700 hover:bg-rose-100"
    : isAmber
    ? "text-amber-700 hover:bg-amber-100"
    : isSuccess
    ? "text-emerald-700 hover:bg-emerald-100"
    : "text-white/80 hover:bg-white/20 hover:text-white";

  return (
    <div className={`rounded-2xl p-4 mb-4 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${containerStyle}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0 select-none">{iconEmoji}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeStyle}`}>
              {isRose ? "Urgent Broadcast" : "Platform Broadcast"}
            </span>
            <span className={`font-black text-xs ${titleColor}`}>{latest.title}</span>
          </div>
          {latest.body && (
            <p className={`text-xs mt-1 font-medium line-clamp-2 ${bodyColor}`}>
              {latest.body}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleDismiss(latest.id)}
        aria-label="Dismiss announcement"
        className={`p-1.5 rounded-xl transition-colors shrink-0 cursor-pointer ${dismissBtnStyle}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
