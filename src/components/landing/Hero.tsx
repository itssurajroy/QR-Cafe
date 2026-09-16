// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Monitor,
  Smartphone,
  LayoutDashboard,
  Sparkles,
  Bell,
  ChefHat,
  Receipt,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { heroStagger, fadeUp, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TABS = [
  {
    id: "guest",
    label: "Guest Menu",
    icon: Smartphone,
    description: "Interactive guest ordering on phone",
    badge: "Guest View",
    accentColor: "text-[#5738F5]",
  },
  {
    id: "kitchen",
    label: "Kitchen Display (KDS)",
    icon: Monitor,
    description: "Live real-time tickets for kitchen staff",
    badge: "Kitchen Display",
    accentColor: "text-emerald-600",
  },
  {
    id: "dashboard",
    label: "Owner POS & Analytics",
    icon: LayoutDashboard,
    description: "Live revenue, analytics & floor status",
    badge: "Owner Console",
    accentColor: "text-violet-600",
  },
];

export function Hero() {
  const [activeTab, setActiveTab] = useState("guest");
  const prefersReducedMotion = useReducedMotion();

  // Guest Menu Interactive State
  const [cartCount, setCartCount] = useState(2);
  const [cartTotal, setCartTotal] = useState(445);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // KDS Interactive State
  const [kdsStatus, setKdsStatus] = useState<"cooking" | "ready">("cooking");

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const noMotion = prefersReducedMotion;
  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const container = noMotion ? { hidden: {}, visible: {} } : heroStagger;

  const handleAddItem = (price: number) => {
    setCartCount((c) => c + 1);
    setCartTotal((t) => t + price);
    setOrderPlaced(false);
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      // simulate auto-switch to KDS to show the magic connection
      setActiveTab("kitchen");
    }, 1200);
  };

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-violet-50/20 to-white">
      {/* ═══ Ambient Glow Mesh ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-br from-violet-200/30 via-purple-100/20 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-40 right-[-100px] w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-[-80px] w-[450px] h-[450px] bg-emerald-100/25 rounded-full blur-[100px]" />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #5738F5 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* ═══ Left Column: High-Impact Copy ═══ */}
          <motion.div
            className="lg:col-span-6 max-w-xl"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* Pill */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/80 rounded-full mb-6 shadow-sm relative overflow-hidden"
              variants={variants}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-300/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
              <Sparkles className="w-4 h-4 text-[#5738F5] relative" />
              <span className="text-xs font-extrabold text-[#5738F5] uppercase tracking-wider relative">
                The Modern Restaurant Operating System
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black leading-[1.08] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6"
              variants={variants}
            >
              Digital table ordering,{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#5738F5] via-[#7C3AED] to-[#9333EA] bg-clip-text text-transparent">
                  without the chaos.
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#5738F5]/30"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 8 Q50 0 100 8 Q150 16 200 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-8"
              variants={variants}
            >
              Guests scan and order from their phones in seconds. Kitchen gets live paperless tickets.
              You watch table turnover and revenue accelerate — from any phone, tablet, or laptop.
            </motion.p>

            {/* Primary CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              variants={variants}
            >
              <Link
                href="/onboarding"
                className="group relative px-8 py-4 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:from-[#4828E0] hover:to-[#6D28D9] text-white font-extrabold rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[#5738F5]/25 hover:shadow-2xl hover:shadow-[#5738F5]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative">Start Free — 14 Days</span>
                <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/c/wah-ji-wah"
                className="px-7 py-4 text-slate-800 bg-white/80 backdrop-blur-sm font-bold rounded-2xl text-base border-2 border-slate-200 hover:border-[#5738F5]/50 hover:bg-violet-50/50 hover:text-[#5738F5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Explore Live Demo
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              className="flex flex-wrap items-center gap-x-6 gap-y-2.5 mt-8 text-sm text-slate-600 font-medium"
              variants={variants}
            >
              {["No credit card required", "Zero app downloads", "15-min launch"].map((text) => (
                <span key={text} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ═══ Right Column: Live Interactive Mockup Experience ═══ */}
          <motion.div
            className="lg:col-span-6 relative"
            initial={noMotion ? {} : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Ambient Badge 1: Floating Real-time order */}
            <motion.div
              className="absolute -top-4 -right-2 z-30 hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-violet-200/80 shadow-xl shadow-violet-500/15"
              animate={noMotion ? {} : { y: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-extrabold text-slate-900">₹445 order placed</div>
                <div className="text-[10px] text-slate-500">Table 04 • Live Kitchen</div>
              </div>
            </motion.div>

            {/* Ambient Badge 2: Floating KDS status */}
            <motion.div
              className="absolute -bottom-4 -left-3 z-30 hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/80 shadow-xl shadow-emerald-500/15"
              animate={noMotion ? {} : { y: [3, -3, 3] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                <ChefHat className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-extrabold text-slate-900">Kitchen Prepared ✓</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Table 04 • Ready to serve</div>
              </div>
            </motion.div>

            {/* Interactive Switcher Tabs */}
            <div className="flex gap-2 mb-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? tab.accentColor : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Preview Container */}
            <div className="rounded-3xl border-2 border-slate-200/80 bg-white shadow-2xl overflow-hidden relative">
              {/* Window Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/80 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-bold text-slate-500 text-[11px]">{currentTab.description}</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#5738F5] bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                  {currentTab.badge}
                </span>
              </div>

              {/* Tab Content Crossfade */}
              <div className="min-h-[380px] p-5 sm:p-6 bg-white">
                <AnimatePresence mode="wait">
                  {/* ── 1. GUEST VIEW ── */}
                  {activeTab === "guest" && (
                    <motion.div
                      key="guest"
                      initial={noMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={noMotion ? {} : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Café Banner */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#5738F5] text-white flex items-center justify-center font-black text-sm">
                            W
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-slate-900">Wah Ji Wah Cafe</div>
                            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                              Table 04 • Instant Dine-in
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          Browser (No App)
                        </span>
                      </div>

                      {/* Dishes List */}
                      <div className="space-y-2.5">
                        {[
                          { name: "Butter Chicken & Naan", price: 380, veg: false, tag: "Bestseller", desc: "Creamy makhani gravy with charcoal chicken" },
                          { name: "Paneer Tikka Grill", price: 280, veg: true, tag: "Popular", desc: "Tandoor roasted cottage cheese with mint chutney" },
                          { name: "Crisp Cold Coffee", price: 120, veg: true, tag: "Refreshing", desc: "Chilled espresso blend with vanilla scoop" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/20 transition-all"
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                  item.veg ? "border-emerald-600" : "border-rose-600"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${item.veg ? "bg-emerald-600" : "bg-rose-600"}`} />
                              </span>
                              <div>
                                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  {item.name}
                                  {item.tag && (
                                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 line-clamp-1">{item.desc}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              <span className="text-sm font-extrabold text-slate-900">₹{item.price}</span>
                              <button
                                onClick={() => handleAddItem(item.price)}
                                className="px-2.5 py-1 text-xs font-bold text-[#5738F5] bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors cursor-pointer"
                              >
                                + ADD
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Cart Bar */}
                      <div className="mt-4 p-3.5 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white rounded-2xl flex items-center justify-between shadow-lg shadow-violet-500/20">
                        <div>
                          <div className="text-xs text-violet-200 font-medium">
                            {cartCount} items selected
                          </div>
                          <div className="font-extrabold text-base">₹{cartTotal}</div>
                        </div>
                        <button
                          onClick={handlePlaceOrder}
                          className="px-4 py-2 bg-white text-[#5738F5] font-extrabold text-xs rounded-xl shadow-sm hover:bg-violet-50 transition-colors cursor-pointer"
                        >
                          {orderPlaced ? "Firing to Kitchen... ✓" : "Place Order →"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── 2. KITCHEN KDS VIEW ── */}
                  {activeTab === "kitchen" && (
                    <motion.div
                      key="kitchen"
                      initial={noMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={noMotion ? {} : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-extrabold text-slate-900 tracking-wider">
                            LIVE KITCHEN DISPLAY TICKETS
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          2 Active Tickets
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Ticket 1 */}
                        <div className="rounded-2xl border-2 border-blue-200 bg-slate-50 overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="bg-blue-600 text-white px-3 py-2 flex items-center justify-between text-xs font-black">
                              <span>TABLE T-04</span>
                              <span className="bg-blue-800/60 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                02:40m
                              </span>
                            </div>
                            <div className="p-3 text-xs space-y-1.5 text-slate-800 font-semibold">
                              <div>1× Butter Chicken & Naan</div>
                              <div>1× Crisp Cold Coffee</div>
                              <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                                Note: Medium spicy, extra mint dip
                              </div>
                            </div>
                          </div>
                          <div className="p-2.5 border-t border-slate-200">
                            <button
                              onClick={() => setKdsStatus(kdsStatus === "cooking" ? "ready" : "cooking")}
                              className={`w-full py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                kdsStatus === "cooking"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {kdsStatus === "cooking" ? "Mark Cooking" : "Ready to Serve ✓"}
                            </button>
                          </div>
                        </div>

                        {/* Ticket 2 */}
                        <div className="rounded-2xl border-2 border-emerald-200 bg-slate-50 overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="bg-emerald-600 text-white px-3 py-2 flex items-center justify-between text-xs font-black">
                              <span>TABLE T-11</span>
                              <span className="bg-emerald-800/60 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                07:15m
                              </span>
                            </div>
                            <div className="p-3 text-xs space-y-1.5 text-slate-800 font-semibold">
                              <div>2× Paneer Tikka Grill</div>
                              <div>1× Garlic Naan Basket</div>
                              <div className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                Chef: Hot & Ready at pass
                              </div>
                            </div>
                          </div>
                          <div className="p-2.5 border-t border-slate-200">
                            <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg">
                              Dispatched to Floor ✓
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── 3. OWNER DASHBOARD VIEW ── */}
                  {activeTab === "dashboard" && (
                    <motion.div
                      key="dashboard"
                      initial={noMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={noMotion ? {} : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Today&apos;s Revenue Cockpit
                        </span>
                        <span className="text-xs font-bold text-[#5738F5] bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                          Live Sync
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Today's Gross", value: "₹24,850", trend: "+16.8% vs last week", color: "text-emerald-600" },
                          { label: "Orders Completed", value: "118", trend: "+12 more tables", color: "text-emerald-600" },
                          { label: "Avg Ticket Size", value: "₹480", trend: "+24% with photos", color: "text-emerald-600" },
                          { label: "Table Turn Time", value: "26 min", trend: "18m faster turnaround", color: "text-[#5738F5]" },
                        ].map((metric, i) => (
                          <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <div className="text-[11px] font-semibold text-slate-500">{metric.label}</div>
                            <div className="text-xl font-black text-slate-900 mt-0.5 font-[family-name:var(--font-plus-jakarta)]">
                              {metric.value}
                            </div>
                            <div className={`text-[10px] font-bold ${metric.color} mt-0.5`}>
                              {metric.trend}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-[#5738F5]">Top Performer: </span>
                          <span className="font-bold text-slate-800">Butter Chicken Handi (42 orders)</span>
                        </div>
                        <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          ₹15,960 rev
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
