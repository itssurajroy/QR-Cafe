// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Megaphone, Check, CheckCheck, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  target_plan: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

const READ_STORAGE_KEY = "qrslice_read_announcement_ids";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load stored read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save read IDs to localStorage
  const persistReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(newSet)));
    } catch {
      // Ignore storage errors
    }
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.ok && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll notifications every 45s & on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    persistReadIds(next);
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    persistReadIds(next);
  };

  const filteredList = notifications.filter((n) => {
    if (filter === "unread") return !readIds.has(n.id);
    return true;
  });

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60_000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-[#5738F5] transition-all cursor-pointer border border-slate-200/60 focus:outline-none"
        aria-label="View Announcements & Notifications"
        title="Super Admin Announcements"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md shadow-rose-500/30 ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden font-sans"
          >
            {/* Popover Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-violet-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Super Admin Broadcasts</h3>
                  <p className="text-[11px] text-slate-300 font-medium">Updates, notices & announcements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Sub-bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === "all" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("unread")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === "unread" ? "bg-[#5738F5] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#5738F5] hover:text-[#4828E0] flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Loading notifications…
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No announcements right now</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    You're all caught up! New updates from Super Admin will appear here.
                  </p>
                </div>
              ) : (
                filteredList.map((n) => {
                  const isRead = readIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => !isRead && markAsRead(n.id)}
                      className={`p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                        isRead ? "bg-white opacity-85 hover:opacity-100" : "bg-violet-50/40 hover:bg-violet-50/70"
                      }`}
                    >
                      {/* Read status dot indicator */}
                      <div className="mt-1 shrink-0">
                        {!isRead ? (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5738F5] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5738F5]" />
                          </span>
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`text-xs font-bold text-slate-900 truncate ${!isRead ? "font-black" : ""}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatTime(n.starts_at || n.created_at)}
                          </span>
                        </div>

                        {n.body && (
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2 line-clamp-3">
                            {n.body}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-violet-100 text-[#5738F5]">
                            {n.target_plan === "all" ? "Global Broadcast" : `Target: ${n.target_plan}`}
                          </span>

                          {!isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-[#5738F5] flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
              QRslice Broadcast System • Real-time
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
