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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { heroStagger, fadeUp, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TABS = [
  {
    id: "guest",
    label: "Guest Menu",
    icon: Smartphone,
    description: "What your guests see when they scan",
    accentText: "text-amber-700",
  },
  {
    id: "kitchen",
    label: "Kitchen Display",
    icon: Monitor,
    description: "Real-time KDS for your kitchen team",
    accentText: "text-emerald-700",
  },
  {
    id: "dashboard",
    label: "Owner Dashboard",
    icon: LayoutDashboard,
    description: "Revenue, analytics, full control",
    accentText: "text-violet-700",
  },
];

export function Hero() {
  const [activeTab, setActiveTab] = useState("guest");
  const prefersReducedMotion = useReducedMotion();

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const noMotion = prefersReducedMotion;
  const variants = noMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : fadeUp;
  const container = noMotion
    ? { hidden: {}, visible: {} }
    : heroStagger;

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
      {/* ═══ Animated Gradient Mesh Background ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-violet-50/30 to-white" />
        
        {/* Animated orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-200/30 rounded-full blur-[120px] animate-pulse [animation-duration:8s]" />
        <div className="absolute top-20 right-[-150px] w-[600px] h-[600px] bg-amber-200/25 rounded-full blur-[100px] animate-pulse [animation-duration:6s] [animation-delay:2s]" />
        <div className="absolute bottom-0 left-[-100px] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[100px] animate-pulse [animation-duration:7s] [animation-delay:4s]" />
        
        {/* Dot grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #5738F5 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ═══ Left Column: Copy — Staggered Entrance ═══ */}
          <motion.div
            className="max-w-xl"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* Trust Pill with shimmer border */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/80 rounded-full mb-6 shadow-sm relative overflow-hidden"
              variants={variants}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-300/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
              <Sparkles className="w-4 h-4 text-[#5738F5] relative" />
              <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider relative">
                Built for Indian Cafés & Restaurants
              </span>
            </motion.div>

            <motion.h1
              className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6"
              variants={variants}
            >
              QR ordering,{" "}
              <span className="relative inline-block">
                {/* Gradient text */}
                <span className="relative z-10 bg-gradient-to-r from-[#5738F5] via-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
                  without the chaos.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#5738F5]/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 8 Q50 0 100 8 Q150 16 200 8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-8 max-w-lg"
              variants={variants}
            >
              Guests scan and order from their phone. Kitchen gets instant live tickets.
              You watch revenue grow — from any phone, tablet, or counter.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              variants={variants}
            >
              <Link
                href="/onboarding"
                className="group relative px-8 py-4 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:from-[#4828E0] hover:to-[#6D28D9] text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#5738F5]/25 hover:shadow-xl hover:shadow-[#5738F5]/35 ring-4 ring-[#5738F5]/10 hover:ring-[#5738F5]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative">Start Free — 14 Days</span>
                <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/c/wah-ji-wah"
                className="px-7 py-4 text-slate-800 bg-white/70 backdrop-blur-sm font-bold rounded-2xl text-base border-2 border-slate-200/90 hover:border-[#5738F5]/40 hover:bg-violet-50/50 hover:text-[#5738F5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                See Live Demo
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-600 font-medium"
              variants={variants}
            >
              {["No credit card", "Zero app downloads", "30-min setup"].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </span>
                  {text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ═══ Right Column: 3D Tilted Product Preview ═══ */}
          <motion.div
            className="relative"
            initial={noMotion ? {} : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ perspective: "1200px" }}
          >
            {/* ── Floating Notification Badges ── */}
            <motion.div
              className="absolute -top-2 -right-4 z-20 hidden lg:flex items-center gap-2 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-violet-200/60 shadow-lg shadow-violet-500/10"
              initial={noMotion ? {} : { opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">₹445 order placed</div>
                <div className="text-[10px] text-slate-500">Table 04 • Just now</div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-3 -left-4 z-20 hidden lg:flex items-center gap-2 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-200/60 shadow-lg shadow-emerald-500/10"
              initial={noMotion ? {} : { opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">Kitchen received</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Preparing now ✓</div>
              </div>
            </motion.div>

            {/* ── Glow behind preview ── */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 via-purple-400/10 to-amber-400/10 rounded-3xl blur-[40px] scale-105" />

            {/* Tabs */}
            <div className="relative z-10 flex gap-2 mb-4 bg-slate-100/90 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/70 w-fit">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-md shadow-slate-200/60 border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? tab.accentText : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Preview Window with 3D tilt */}
            <div
              className="relative rounded-3xl border-2 border-white/80 bg-white shadow-[0_20px_80px_-20px_rgba(87,56,245,0.2),0_0_0_1px_rgba(87,56,245,0.05)] overflow-hidden z-10 hover:[transform:rotateY(0deg)_rotateX(0deg)] transition-transform duration-500"
              style={{ transform: "rotateY(-2deg) rotateX(1deg)" }}
            >
              {/* Window Header */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500" />
                </div>
                <div className="flex-1 text-center text-xs font-bold text-slate-500 tracking-wide">
                  {currentTab.description}
                </div>
              </div>

              {/* Content Area with AnimatePresence crossfade */}
              <div className="bg-white min-h-[380px] sm:min-h-[420px] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {/* Guest Menu Preview */}
                  {activeTab === "guest" && (
                    <motion.div
                      key="guest"
                      className="p-6 space-y-4"
                      initial={noMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={noMotion ? {} : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-amber-500/20">
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
                        <span className="text-xs font-bold text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
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
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-50/50 to-transparent border border-slate-200/60 hover:border-amber-300/60 hover:from-amber-50/30 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                item.veg ? "border-emerald-600" : "border-rose-600"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${item.veg ? "bg-emerald-600" : "bg-rose-600"}`} />
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                {item.name}
                                {item.tag && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-gradient-to-r from-amber-100 to-orange-100 px-1.5 py-0.5 rounded">
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

                      <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/20">
                        <div>
                          <span className="text-xs font-medium text-amber-100">2 items in order</span>
                          <span className="font-extrabold ml-2 text-base">₹445</span>
                        </div>
                        <span className="text-xs font-bold bg-white text-orange-700 px-4 py-1.5 rounded-xl shadow-sm">
                          Place Order →
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Kitchen Display Preview */}
                  {activeTab === "kitchen" && (
                    <motion.div
                      key="kitchen"
                      className="p-5 bg-gradient-to-b from-slate-50 to-slate-100/50 min-h-[380px] sm:min-h-[420px] space-y-4"
                      initial={noMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={noMotion ? {} : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                          <span className="text-xs font-extrabold text-slate-800 tracking-wider">LIVE KITCHEN DISPLAY (KDS)</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1 rounded-lg border border-emerald-200">2 Active Tickets</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-white rounded-2xl border-2 border-blue-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-white flex items-center justify-between">
                              <span className="font-black text-sm">TABLE T-04</span>
                              <span className="text-[11px] font-bold bg-blue-800/40 px-2 py-0.5 rounded">2 min ago</span>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800"><span>1× Butter Chicken</span><span className="text-slate-400">Main</span></div>
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800"><span>2× Garlic Naan</span><span className="text-slate-400">Bread</span></div>
                              <div className="text-[11px] font-medium text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100">Note: Medium spicy, crisp bread</div>
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                            <div className="w-full py-1.5 text-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">Mark Cooking</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl border-2 border-amber-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-white flex items-center justify-between">
                              <span className="font-black text-sm">TABLE T-12</span>
                              <span className="text-[11px] font-bold bg-amber-700/40 px-2 py-0.5 rounded">8 min ago</span>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800"><span>2× Paneer Tikka</span><span className="text-slate-400">Starters</span></div>
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800"><span>1× Dal Makhani</span><span className="text-slate-400">Gravy</span></div>
                              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100 flex items-center gap-1"><span>✓</span> Almost Ready</div>
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                            <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">Ready to Serve</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Dashboard Preview */}
                  {activeTab === "dashboard" && (
                    <motion.div
                      key="dashboard"
                      className="p-6 space-y-4"
                      initial={noMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={noMotion ? {} : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Outlet Performance</span>
                        <span className="text-xs font-bold text-[#5738F5] bg-gradient-to-r from-violet-50 to-purple-50 px-2.5 py-1 rounded-lg border border-violet-200/60">Live Sync</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Today's Revenue", value: "₹18,450", trend: "+14.5%", color: "text-emerald-700" },
                          { label: "Total Orders", value: "96", trend: "+8.2%", color: "text-emerald-700" },
                          { label: "Average Bill", value: "₹465", trend: "+5.1%", color: "text-emerald-700" },
                          { label: "Table Turn Time", value: "28 min", trend: "-12 min faster", color: "text-[#5738F5]" },
                        ].map((stat, i) => (
                          <div key={i} className="p-3.5 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60">
                            <div className="text-[11px] font-semibold text-slate-500">{stat.label}</div>
                            <div className="text-xl font-black text-slate-900 mt-1 font-[family-name:var(--font-plus-jakarta)]">{stat.value}</div>
                            <div className={`text-[11px] font-bold ${stat.color} mt-0.5`}>{stat.trend}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3.5 bg-gradient-to-r from-violet-50/80 to-purple-50/60 border border-violet-200/60 rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#5738F5]">Top Selling Item</div>
                          <div className="text-sm font-bold text-slate-900">Butter Chicken — 32 orders</div>
                        </div>
                        <div className="text-2xl">🏆</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom curve separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 60V30C360 0 1080 0 1440 30V60H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
