"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Monitor,
  Smartphone,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

const TABS = [
  {
    id: "guest",
    label: "Guest Menu",
    icon: Smartphone,
    description: "What your guests see when they scan",
    gradient: "from-amber-50 to-orange-50",
    border: "border-amber-200/60",
    accentText: "text-amber-700",
    accentBg: "bg-amber-100",
  },
  {
    id: "kitchen",
    label: "Kitchen Display",
    icon: Monitor,
    description: "Real-time KDS for your kitchen team",
    gradient: "from-emerald-50 to-teal-50",
    border: "border-emerald-200/60",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-100",
  },
  {
    id: "dashboard",
    label: "Owner Dashboard",
    icon: LayoutDashboard,
    description: "Revenue, analytics, full control",
    gradient: "from-violet-50 to-indigo-50",
    border: "border-violet-200/60",
    accentText: "text-violet-700",
    accentBg: "bg-violet-100",
  },
];

export function Hero() {
  const [activeTab, setActiveTab] = useState("guest");

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden bg-gradient-to-b from-white via-[#FAF9F6] to-white">
      {/* Background decorative elements - clean light tones, no blur glass */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-100/40 rounded-full blur-[100px]" />
        <div className="absolute top-36 right-[-100px] w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy */}
          <div className="max-w-xl">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#5738F5]" />
              <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
                Built for Indian Cafés & Restaurants
              </span>
            </div>

            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6">
              QR ordering,{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#5738F5]">without the chaos.</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#5738F5]/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 8 Q50 0 100 8 Q150 16 200 8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-8 max-w-lg">
              Guests scan and order from their phone. Kitchen gets instant live tickets.
              You watch revenue grow — from any phone, tablet, or counter.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/onboarding"
                className="group px-8 py-4 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:from-[#4828E0] hover:to-[#6D28D9] text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#5738F5]/25 hover:shadow-xl hover:shadow-[#5738F5]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Start Free — 14 Days
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/c/wah-ji-wah"
                className="px-7 py-4 text-slate-800 bg-white font-bold rounded-2xl text-base border-2 border-slate-200/90 hover:border-[#5738F5]/40 hover:bg-violet-50/50 hover:text-[#5738F5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                See Live Demo
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Zero app downloads
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                30-min setup
              </span>
            </div>
          </div>

          {/* Right Column: Tabbed Product Preview (Clean Solid Surfaces) */}
          <div className="relative">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 w-fit">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? tab.accentText : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Preview Window (Solid White + Refined Ambient Shadow) */}
            <div
              className="relative rounded-3xl border-2 border-slate-200 bg-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.12),0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300"
            >
              {/* Window Header */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-slate-200/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 text-center text-xs font-bold text-slate-500 tracking-wide">
                  {currentTab.description}
                </div>
              </div>

              {/* Content Area */}
              <div className="bg-white min-h-[380px] sm:min-h-[420px] relative overflow-hidden">
                {/* Guest Menu Preview */}
                {activeTab === "guest" && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-base shadow-sm">
                          W
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">WAH JI WAH</div>
                          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            Table 04 • Live Kitchen
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                        Guest View
                      </span>
                    </div>

                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      🔥 Chef&apos;s Signature Picks
                    </div>

                    {[
                      { name: "Butter Chicken", price: "₹380", veg: false, tag: "Bestseller", desc: "Tandoori chicken in rich makhani gravy" },
                      { name: "Paneer Tikka", price: "₹280", veg: true, tag: "Popular", desc: "Charcoal grilled cottage cheese cubes" },
                      { name: "Garlic Butter Naan", price: "₹65", veg: true, desc: "Crisp clay oven bread brushed with garlic" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                              item.veg ? "border-emerald-600" : "border-rose-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.veg ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                            />
                          </span>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {item.name}
                              {item.tag && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{item.desc}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-sm font-bold text-slate-900">{item.price}</span>
                          <button className="px-3 py-1 text-xs font-bold text-[#5738F5] bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors cursor-pointer">
                            + ADD
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Order Bar - Warm Amber/Orange, NOT dark! */}
                    <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl flex items-center justify-between shadow-md shadow-amber-600/20">
                      <div>
                        <span className="text-xs font-medium text-amber-100">2 items in order</span>
                        <span className="font-extrabold ml-2 text-base">₹445</span>
                      </div>
                      <span className="text-xs font-bold bg-white text-orange-700 px-4 py-1.5 rounded-xl shadow-sm">
                        Place Order →
                      </span>
                    </div>
                  </div>
                )}

                {/* Kitchen Display Preview - Crisp Light KDS, NO DARK! */}
                {activeTab === "kitchen" && (
                  <div className="p-5 bg-slate-50 min-h-[380px] sm:min-h-[420px] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-xs font-extrabold text-slate-800 tracking-wider">
                          LIVE KITCHEN DISPLAY (KDS)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                        2 Active Tickets
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Ticket 1 */}
                      <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="bg-blue-600 px-3 py-2 text-white flex items-center justify-between">
                            <span className="font-black text-sm">TABLE T-04</span>
                            <span className="text-[11px] font-bold bg-blue-700/80 px-2 py-0.5 rounded">
                              2 min ago
                            </span>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>1× Butter Chicken</span>
                              <span className="text-slate-400">Main</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>2× Garlic Naan</span>
                              <span className="text-slate-400">Bread</span>
                            </div>
                            <div className="text-[11px] font-medium text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100">
                              Note: Medium spicy, crisp bread
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                          <div className="w-full py-1.5 text-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                            Mark Cooking
                          </div>
                        </div>
                      </div>

                      {/* Ticket 2 */}
                      <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="bg-amber-600 px-3 py-2 text-white flex items-center justify-between">
                            <span className="font-black text-sm">TABLE T-12</span>
                            <span className="text-[11px] font-bold bg-amber-700/80 px-2 py-0.5 rounded">
                              8 min ago
                            </span>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>2× Paneer Tikka</span>
                              <span className="text-slate-400">Starters</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>1× Dal Makhani</span>
                              <span className="text-slate-400">Gravy</span>
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100 flex items-center gap-1">
                              <span>✓</span> Almost Ready
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                          <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                            Ready to Serve
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dashboard Preview */}
                {activeTab === "dashboard" && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Today&apos;s Outlet Performance
                      </span>
                      <span className="text-xs font-bold text-[#5738F5] bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60">
                        Live Sync
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Today's Revenue", value: "₹18,450", trend: "+14.5%", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                        { label: "Total Orders", value: "96", trend: "+8.2%", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                        { label: "Average Bill", value: "₹465", trend: "+5.1%", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                        { label: "Table Turn Time", value: "28 min", trend: "-12 min faster", color: "text-[#5738F5]", bg: "bg-violet-50 border-violet-100" },
                      ].map((stat, i) => (
                        <div key={i} className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-slate-200/80">
                          <div className="text-[11px] font-semibold text-slate-500">{stat.label}</div>
                          <div className="text-xl font-black text-slate-900 mt-1 font-[family-name:var(--font-plus-jakarta)]">
                            {stat.value}
                          </div>
                          <div className={`text-[11px] font-bold ${stat.color} mt-0.5 inline-block px-1.5 py-0.2 rounded`}>
                            {stat.trend}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3.5 bg-violet-50/80 border border-violet-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#5738F5]">Top Selling Item</div>
                        <div className="text-sm font-bold text-slate-900">Butter Chicken — 32 orders</div>
                      </div>
                      <div className="text-2xl">🏆</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
