// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

export function BroadcastTab() {
  const { tab, handleSaveConfig, platformConfig, flash } = useSuperAdmin();
  
  const existing = platformConfig?.global_broadcast;
  const [subject, setSubject] = useState(existing?.subject || "");
  const [message, setMessage] = useState(existing?.message || "");
  const [type, setType] = useState(existing?.type || "info");
  const [delivery, setDelivery] = useState(existing?.delivery || "both");
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    if (existing?.active) {
      setSubject(existing.subject || "");
      setMessage(existing.message || "");
      setType(existing.type || "info");
      setDelivery(existing.delivery || "both");
    }
  }, [existing]);
  
  if (tab !== "broadcast") return null;

  const handleSend = async () => {
    if (!subject.trim()) {
      flash("err", "Subject is required");
      return;
    }
    setIsSending(true);
    try {
      const payload = {
        subject: subject.trim(),
        message: message.trim(),
        type,
        delivery,
        active: true,
        sent_at: new Date().toISOString(),
      };
      await handleSaveConfig("global_broadcast", payload);
      if (typeof window !== "undefined") {
        localStorage.setItem("platform_broadcast", JSON.stringify(payload));
      }
      flash("ok", "Broadcast published to all tenants successfully!");
    } catch {
      flash("err", "Failed to publish broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = async () => {
    setIsSending(true);
    try {
      await handleSaveConfig("global_broadcast", { active: false });
      if (typeof window !== "undefined") {
        localStorage.removeItem("platform_broadcast");
      }
      setSubject("");
      setMessage("");
      flash("ok", "Broadcast revoked and cleared");
    } catch {
      flash("err", "Failed to clear broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const isActive = Boolean(existing?.active && existing?.subject);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Current Active Announcement Status */}
      {isActive && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Active Global Broadcast Live Across All Tenant Portals
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {existing.subject}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={isSending}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Revoke Broadcast ✕
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Compose Global Platform Broadcast</h2>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
              Cross-Tenant
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-xs font-medium">
            Broadcast emergency alerts, maintenance windows, or feature updates to all restaurant owners and staff.
          </p>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject / Headline</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Scheduled Core Maintenance: Sept 18 at 02:00 IST" 
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] font-semibold"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Announcement Body</label>
            <textarea 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide complete details, impact assessment, and next steps for restaurant operators…" 
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Message Severity</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="info">General Info (Slate / Violet)</option>
                <option value="success">Feature Release (Emerald)</option>
                <option value="warning">System Advisory (Amber)</option>
                <option value="danger">Critical Outage / Urgent (Rose)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery Channels</label>
              <select 
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="banner">In-App Banner Only</option>
                <option value="email">Email Broadcast Only</option>
                <option value="both">Both In-App Banner & Email</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            {isActive && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isSending}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Clear Broadcast
              </button>
            )}
            <button 
              type="button"
              onClick={handleSend}
              disabled={isSending || !subject.trim()}
              className="px-5 py-2.5 bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isSending ? "Publishing Broadcast…" : "Publish Global Broadcast"}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Live Preview Section */}
      {subject && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live In-App Banner Preview</h3>
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            type === "info" ? "bg-violet-50 border-violet-200 text-violet-950" :
            type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-950" :
            type === "warning" ? "bg-amber-50 border-amber-200 text-amber-950" :
            "bg-rose-50 border-rose-200 text-rose-950"
          }`}>
            <span className="text-base mt-0.5">
              {type === "info" ? "ℹ️" : type === "success" ? "✨" : type === "warning" ? "⚠️" : "🚨"}
            </span>
            <div>
              <div className="font-bold text-xs">{subject}</div>
              {message && <div className="text-xs opacity-90 mt-1 whitespace-pre-wrap font-medium">{message}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
