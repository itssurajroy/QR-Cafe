// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { QrSliceLogo, QrSliceIcon } from "@/components/brand/QrSliceLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DashboardIcon,
  ClipboardListIcon,
  ChefHatIcon,
  ChairIcon,
  BookOpenIcon,
  BoxIcon,
  SoupIcon,
  CreditCardIcon,
  ChartIcon,
  UsersIcon,
  GearIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SearchIcon,
  SlidersIcon,
  PlugIcon,
} from "@/components/Icons";

export type AdminSectionId =
  // OVERVIEW
  | "dashboard"
  | "orders"
  | "kitchen"
  | "tables"
  // MENU
  | "menu"
  | "categories"
  | "modifiers"
  // OPERATIONS
  | "inventory"
  | "recipes"
  | "billing"
  // BUSINESS
  | "analytics"
  | "crm"
  | "staff"
  // SETTINGS
  | "settings"
  | "account"
  | "integrations";

interface NavItem {
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
      { id: "orders", label: "Orders", icon: ClipboardListIcon },
      { id: "kitchen", label: "Kitchen", icon: ChefHatIcon },
      { id: "tables", label: "Tables", icon: ChairIcon },
    ],
  },
  {
    title: "MENU",
    items: [
      { id: "menu", label: "Menu Items", icon: BookOpenIcon },
      { id: "categories", label: "Categories", icon: SlidersIcon },
      { id: "modifiers", label: "Modifiers", icon: SlidersIcon },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "inventory", label: "Inventory", icon: BoxIcon },
      { id: "recipes", label: "Recipes", icon: SoupIcon },
      { id: "billing", label: "Billing", icon: CreditCardIcon },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { id: "analytics", label: "Analytics", icon: ChartIcon },
      { id: "crm", label: "Loyalty & CRM", icon: UsersIcon },
      { id: "staff", label: "Staff", icon: UsersIcon },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { id: "settings", label: "Restaurant", icon: GearIcon },
      { id: "account", label: "Account", icon: ShieldCheckIcon },
      { id: "integrations", label: "Integrations", icon: PlugIcon },
    ],
  },
];

interface AdminAppShellProps {
  currentSection: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  restaurantName?: string;
  restaurantSlug?: string;
  liveRevenue?: number;
  liveOrders?: number;
  onOpenSearch?: () => void;
  children: React.ReactNode;
}

export function AdminAppShell({
  currentSection,
  onSelectSection,
  restaurantName = "QRslice",
  restaurantSlug = "cafe",
  liveRevenue = 0,
  liveOrders = 0,
  onOpenSearch,
  children,
}: AdminAppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' for search, 'Esc' to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
        e.preventDefault();
        onOpenSearch?.();
      }
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen, onOpenSearch]);

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-[#007AFF] selection:text-white antialiased">
      {/* Top Mobile Bar */}
      <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="w-10 h-10 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] flex items-center justify-center text-slate-800 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <QrSliceLogo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link
            href={`/c/${restaurantSlug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-[#EEEAFE] text-[#5738F5] font-bold text-xs flex items-center gap-1"
          >
            <span>Menu ↗</span>
          </Link>
          <Link
            href="/pos?view=kitchen"
            className="px-3 py-1.5 rounded-xl bg-[#5738F5] text-white font-bold text-xs"
          >
            KDS
          </Link>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#E7E4F0] transition-all duration-300 z-20 select-none ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo & Brand Header */}
          <div className="h-16 px-5 border-b border-[#E7E4F0] flex items-center justify-between">
            {collapsed ? (
              <div className="mx-auto">
                <QrSliceIcon className="w-8 h-8" />
              </div>
            ) : (
              <QrSliceLogo size="md" />
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-[#6F7185] hover:text-[#17142B] hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Quick Outlet Selector */}
          {!collapsed && (
            <div className="p-3 mx-3 my-2 rounded-2xl bg-[#EEEAFE]/60 border border-[#5738F5]/15 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#5738F5]">
                  ACTIVE OUTLET
                </div>
                <div className="text-xs font-black text-[#17142B] truncate">{restaurantName}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="System Online" />
            </div>
          )}

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 py-1 text-[10px] font-black tracking-widest text-[#6F7185] uppercase">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = currentSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25 font-extrabold"
                          : "text-[#6F7185] hover:text-[#17142B] hover:bg-[#EEEAFE]/50"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-current"}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#E7E4F0] space-y-2">
            <Link
              href={`/c/${restaurantSlug}`}
              target="_blank"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <span>🍽️</span>
              {!collapsed && <span>Live Guest Menu ↗</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER OVERLAY */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-full bg-white h-full flex flex-col z-10 shadow-2xl p-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E4F0]">
                <QrSliceLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6F7185] px-2">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const isActive = currentSection === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelectSection(item.id);
                            setMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25"
                              : "text-[#6F7185] hover:text-[#17142B] hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 py-3.5 sticky top-0 z-10 hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {greetingTime()}, {restaurantName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Here's what's happening today.</p>
            </div>

            {/* Quick Metrics & Search */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs text-[#6F7185] font-semibold border border-slate-200/60 transition-all cursor-pointer"
              >
                <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Search orders, items, tables…</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-300 shadow-2xs">
                  /
                </kbd>
              </button>

              <div className="flex items-center gap-2 border-l border-[#E7E4F0] pl-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEEAFE] border border-[#5738F5]/20">
                  <span className="text-[11px] font-semibold text-[#5738F5]">Revenue</span>
                  <span className="font-mono font-black text-xs text-[#5738F5]">
                    ₹{(liveRevenue / 100).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-700">Orders</span>
                  <span className="font-mono font-black text-xs text-emerald-700">{liveOrders}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              </div>

              <NotificationBell />

              <button
                type="button"
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </header>

          {/* Sub-body Content Slot */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

