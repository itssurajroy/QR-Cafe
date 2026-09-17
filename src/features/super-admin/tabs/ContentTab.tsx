// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import type { TrialEmailDay } from "@/lib/email";

// Read-only preview of the existing trial-email templates in src/lib/email.ts.
const EMAIL_TEMPLATES: { day: TrialEmailDay; subject: string; blurb: string }[] = [
  { day: 0, subject: "Welcome to QRslice — your 14-day trial has started 🎉", blurb: "Day-0 welcome: 14-day full-access trial live, 30-minute setup checklist, upgrade CTA." },
  { day: 7, subject: "You're halfway through your QRslice trial", blurb: "Day-7 midpoint: 7 days left plus order/revenue stats when available, upgrade CTA." },
  { day: 12, subject: "2 days left — keep your kitchen running", blurb: "Day-12 nudge: 2 days remaining, upgrade now so ordering never pauses during service." },
  { day: 14, subject: "Your QRslice trial has ended — upgrade to restore ordering", blurb: "Day-14 expiry: ordering paused, nothing deleted, restore-access CTA." },
];

export function ContentTab() {
  const { tab } = useSuperAdmin();
  const [heroEyebrow, setHeroEyebrow] = useState("Next-Gen QR Ordering & Kitchen OS");
  const [heroHeadlineA, setHeroHeadlineA] = useState("Run your café from one system.");
  const [heroHeadlineB, setHeroHeadlineB] = useState("QR ordering. Live kitchen. Real stock.");
  const [heroSub, setHeroSub] = useState("Customers scan, order, and pay from the table. Kitchen gets tickets instantly. You control menu, stock, and billing — all in one place.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  
  useEffect(() => {
    if (tab === "content") {
      fetch("/api/super/content")
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.items) {
            const heroData = data.items.find((item: any) => item.key === "cms.hero");
            if (heroData && heroData.value) {
              if (heroData.value.eyebrow) setHeroEyebrow(heroData.value.eyebrow);
              if (heroData.value.headlineA) setHeroHeadlineA(heroData.value.headlineA);
              if (heroData.value.headlineB) setHeroHeadlineB(heroData.value.headlineB);
              if (heroData.value.sub) setHeroSub(heroData.value.sub);
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/super/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "cms.hero",
          value: {
            eyebrow: heroEyebrow,
            headlineA: heroHeadlineA,
            headlineB: heroHeadlineB,
            sub: heroSub,
            primaryCta: "Start 14-day free trial",
            secondaryCta: "Book a demo",
            trustLine: "No credit card required · Live in 30 minutes · Cancel anytime",
            pills: ["Instant QR Menu", "Multi-station KDS", "Stock & Recipes", "Bluetooth KOT"]
          }
        })
      });
      if (!res.ok) throw new Error("Failed to save content");
      setMsg({ text: "Landing page copy saved successfully!", type: "success" });
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-500 text-xs font-medium">Loading CMS configuration…</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero Content Card */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">Public Website Hero Copy</h2>
              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
                CMS
              </span>
            </div>
            <p className="text-slate-500 mt-0.5 text-xs font-medium">Configure the live headlines and value proposition on the root landing page.</p>
          </div>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            {isSaving ? "Saving…" : "Save Live Copy"}
          </button>
        </div>

        {msg && (
          <div className={`p-3 rounded-xl border text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Eyebrow Badge Text</label>
            <input 
              type="text" 
              value={heroEyebrow}
              onChange={(e) => setHeroEyebrow(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5738F5] font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Headline Part A (Solid Text)</label>
              <input 
                type="text" 
                value={heroHeadlineA}
                onChange={(e) => setHeroHeadlineA(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5738F5] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Headline Part B (Accent Text)</label>
              <input 
                type="text" 
                value={heroHeadlineB}
                onChange={(e) => setHeroHeadlineB(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5738F5] font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subheadline Description</label>
            <textarea 
              rows={3}
              value={heroSub}
              onChange={(e) => setHeroSub(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5738F5] resize-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Email Lifecycle Templates (Preview) */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">Automated Trial Email Sequence (Preview)</h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
              Read-Only
            </span>
          </div>
          <p className="text-slate-500 mt-0.5 text-xs font-medium">Lifecycle onboarding and trial reminder emails dispatched automatically by background cron.</p>
        </div>
        <div className="space-y-3">
          {EMAIL_TEMPLATES.map((t) => (
            <div key={t.day} className="border border-slate-200/80 bg-slate-50/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 text-[#5738F5] border border-violet-200">
                  Day {t.day}
                </span>
                <span className="text-xs font-bold text-slate-900">{t.subject}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{t.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
