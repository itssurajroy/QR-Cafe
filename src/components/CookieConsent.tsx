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
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          We use cookies
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          QRslice uses cookies to provide essential functionality, remember your
          preferences, and understand how the service is used. You can choose
          which cookies to accept.
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked
              disabled
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-slate-700">Essential (required)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={consent.functional}
              onChange={(e) =>
                setConsent((p) => ({ ...p, functional: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-slate-700">Functional</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) =>
                setConsent((p) => ({ ...p, analytics: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-slate-700">Analytics</span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={acceptAll}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Accept All
          </button>
          <button
            onClick={acceptSelected}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Save Preferences
          </button>
          <button
            onClick={rejectOptional}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Reject Optional
          </button>
          <Link
            href="/legal/cookies"
            className="ml-auto text-xs text-slate-500 hover:text-slate-700"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
