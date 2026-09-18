// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import Link from "next/link";
import { useSuperAdmin } from "./SuperAdminContext";

export function SuperHeader() {
  const { tab, setShowNewCafeModal, setMobileMenuOpen } = useSuperAdmin();

  // Tab Title Pretty Formatter
  const titles: Record<string, string> = {
    dashboard: "Platform Overview",
    cafes: "Restaurants & Tenants",
    outlets: "Outlets Directory",
    subscriptions: "Subscription Accounts",
    billing: "Billing & Invoices",
    orders: "Live Orders Stream",
    staff: "Staff Directory",
    users: "Platform User Accounts",
    support: "Support Desk",
    analytics: "Platform Analytics",
    funnel: "Funnel Analytics",
    "system-health": "System Health & Monitoring",
    integrations: "Integrations Hub",
    jobs: "Background Jobs Queue",
    broadcast: "Platform Notifications",
    announcements: "In-App Announcements",
    config: "Platform Configuration",
    "feature-flags": "Feature Flags Management",
    admins: "Super Admin Users",
    roles: "Roles & Permissions Matrix",
    audit: "Security Audit Logs",
    content: "Content & Marketing Mgmt",
    settings: "Platform Engine Settings",
    "api-keys": "API Keys & Secrets",
  };

  const currentTitle = titles[tab] || `${tab.charAt(0).toUpperCase() + tab.slice(1)} Management`;

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white px-4 sm:px-6 pt-[env(safe-area-inset-top)] flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors touch-target flex items-center justify-center shrink-0"
          aria-label="Open Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center text-xs font-semibold text-slate-400 gap-1.5 shrink-0">
          <span>Console</span>
          <span>/</span>
        </div>
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate">{currentTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search Keyboard Shortcut Indicator */}
        <button
          type="button"
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search or jump to...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400">⌘K</kbd>
        </button>

        {/* New Cafe CTA */}
        <button
          type="button"
          onClick={() => setShowNewCafeModal(true)}
          className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#492ee0] text-white font-bold text-xs transition-all shadow-sm shadow-[#5738F5]/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span>＋ New Café Tenant</span>
        </button>

        {/* Super Admin Badge & Sign Out */}
        <div className="h-5 w-px bg-slate-200"></div>

        <Link
          href="/login"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 border border-slate-200/80 px-3 py-1.5 rounded-xl hover:bg-slate-50 bg-white transition-colors"
        >
          Sign Out
        </Link>
      </div>
    </header>
  );
}
