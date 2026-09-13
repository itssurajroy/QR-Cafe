import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../SuperAdminContext';
import type { TrialEmailDay } from '@/lib/email';

// Read-only preview of the existing trial-email templates in src/lib/email.ts.
// Sends happen only via the existing sendTrialEmail helper (cron + provisioning) —
// this section adds no sending paths and no send buttons.
const EMAIL_TEMPLATES: { day: TrialEmailDay; subject: string; blurb: string }[] = [
  { day: 0, subject: "Welcome to QRslice — your 14-day trial has started 🎉", blurb: "Day-0 welcome: 14-day full-access trial live, 30-minute setup checklist, upgrade CTA." },
  { day: 7, subject: "You're halfway through your QRslice trial", blurb: "Day-7 midpoint: 7 days left plus order/revenue stats when available, upgrade CTA." },
  { day: 12, subject: "2 days left — keep your kitchen running", blurb: "Day-12 nudge: 2 days remaining, upgrade now so ordering never pauses during service." },
  { day: 14, subject: "Your QRslice trial has ended — upgrade to restore ordering", blurb: "Day-14 expiry: ordering paused, nothing deleted, restore-access CTA." },
];

export function ContentTab() {
  const { tab } = useSuperAdmin();
  const [heroEyebrow, setHeroEyebrow] = useState('Next-Gen QR Ordering & Kitchen OS');
  const [heroHeadlineA, setHeroHeadlineA] = useState('Run your café from one system.');
  const [heroHeadlineB, setHeroHeadlineB] = useState('QR ordering. Live kitchen. Real stock.');
  const [heroSub, setHeroSub] = useState('Customers scan, order, and pay from the table. Kitchen gets tickets instantly. You control menu, stock, and billing — all in one place.');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{text: string, type: 'error'|'success'} | null>(null);
  
  useEffect(() => {
    if (tab === 'content') {
      fetch('/api/super/content')
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.items) {
            const heroData = data.items.find((item: any) => item.key === 'cms.hero');
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
  }, [tab]);

  if (tab !== 'content') return null;

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/super/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'cms.hero',
          value: {
            eyebrow: heroEyebrow,
            headlineA: heroHeadlineA,
            headlineB: heroHeadlineB,
            sub: heroSub,
            // Retain these defaults so they don't break
            primaryCta: "Start 14-day free trial",
            secondaryCta: "Watch live demo",
            trustLine: "No credit card required · Live in 30 minutes · Cancel anytime",
            pills: ["Instant QR Menu", "Multi-station KDS", "Stock & Recipes", "Bluetooth KOT"]
          }
        })
      });
      if (!res.ok) throw new Error('Failed to save content');
      setMsg({ text: 'Content saved successfully!', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-500 text-sm">Loading content settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-8 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Landing Page Content</h2>
            <p className="text-slate-500 dark:text-stone-400 mt-1 text-sm">Update copy on your public website. Changes apply immediately.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {msg && (
          <div className={`p-3 mb-6 rounded-lg border text-sm font-bold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {msg.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Hero Section */}
          <div className="border border-slate-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-stone-950/50 p-3 border-b border-slate-200 dark:border-stone-800 font-bold text-sm text-slate-700 dark:text-stone-300 flex items-center gap-2">
              <span>🦸‍♂️</span> Hero Section
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Eyebrow (Small text above title)</label>
                <input 
                  type="text" 
                  value={heroEyebrow}
                  onChange={(e) => setHeroEyebrow(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Headline Part A (Black text)</label>
                <input 
                  type="text" 
                  value={heroHeadlineA}
                  onChange={(e) => setHeroHeadlineA(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Headline Part B (Gradient text)</label>
                <input 
                  type="text" 
                  value={heroHeadlineB}
                  onChange={(e) => setHeroHeadlineB(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-stone-400 mb-1">Subheadline</label>
                <textarea 
                  rows={3}
                  value={heroSub}
                  onChange={(e) => setHeroSub(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 p-8 rounded-2xl shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Email Templates (preview only)</h2>
          <p className="text-slate-500 dark:text-stone-400 mt-1 text-sm">Trial lifecycle emails sent via the existing <span className="font-mono">sendTrialEmail</span> helper. Preview only — no sending from here.</p>
        </div>
        <div className="space-y-3">
          {EMAIL_TEMPLATES.map((t) => (
            <div key={t.day} className="border border-slate-200 dark:border-stone-800 rounded-xl p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">Day {t.day}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{t.subject}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-stone-400 mt-1">{t.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
