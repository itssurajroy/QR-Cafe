"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "qrslice-cookie-consent";

// Operational screens never show the banner (kitchen displays, POS
// terminals, staff/admin consoles).
const HIDDEN_PREFIXES = ["/pos", "/admin", "/super", "/login"];

type ConsentState = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
};

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  functional: false,
  analytics: false,
};

/** Read the stored consent (null = not answered yet). */
export function getCookieConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? (JSON.parse(stored) as ConsentState) : null;
  } catch {
    return null;
  }
}

/** True when the user has opted into analytics tracking. */
export function isAnalyticsAllowed(): boolean {
  return getCookieConsent()?.analytics === true;
}

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const state = { essential: true, functional: true, analytics: true };
    save(state);
  };

  const acceptSelected = () => {
    save(consent);
  };

  const rejectOptional = () => {
    const state = { essential: true, functional: false, analytics: false };
    save(state);
  };

  const save = (state: ConsentState) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
    window.dispatchEvent(
      new CustomEvent("cookie-consent", { detail: state }),
    );
  };

  if (!visible) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-black/[0.08] bg-white/90 backdrop-blur-xl p-5 shadow-2xl sm:p-6 pointer-events-auto animate-in slide-in-from-bottom duration-300">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Cookie Preferences & Privacy
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          QrSlice uses cookies to provide seamless table ordering, maintain table session state, and evaluate platform reliability. You can personalize which cookies to allow.
        </p>

        <div className="mt-3.5 flex flex-wrap gap-4 text-xs font-medium">
          <label className="flex items-center gap-2 cursor-default">
            <input
              type="checkbox"
              checked
              disabled
              className="h-4 w-4 rounded-md border-black/[0.1] text-[#007AFF]"
            />
            <span className="text-slate-800 font-semibold">Essential (Required)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent.functional}
              onChange={(e) =>
                setConsent((p) => ({ ...p, functional: e.target.checked }))
              }
              className="h-4 w-4 rounded-md border-black/[0.1] text-[#007AFF] focus:ring-0"
            />
            <span className="text-slate-700">Functional</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) =>
                setConsent((p) => ({ ...p, analytics: e.target.checked }))
              }
              className="h-4 w-4 rounded-md border-black/[0.1] text-[#007AFF] focus:ring-0"
            />
            <span className="text-slate-700">Analytics</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            onClick={acceptAll}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-xs cursor-pointer"
          >
            Accept All
          </button>
          <button
            onClick={acceptSelected}
            className="rounded-full border border-black/[0.08] bg-black/[0.04] px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-black/[0.07] active:scale-95 cursor-pointer"
          >
            Save Preferences
          </button>
          <button
            onClick={rejectOptional}
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            Reject Optional
          </button>
          <Link
            href="/legal/cookies"
            className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
