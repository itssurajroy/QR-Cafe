// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import {
  QrCode,
  ChefHat,
  Receipt,
  Boxes,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Features() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;
  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;

  // Interactive mock state for Bento 1
  const [mockVeg, setMockVeg] = useState(true);
  // Interactive mock state for Bento 2
  const [ticketStatus, setTicketStatus] = useState<"cooking" | "ready">("cooking");

  return (
    <section id="features" className="py-20 sm:py-28 bg-[#FAF9F6] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100/80 border border-violet-200 rounded-full mb-4 shadow-sm"
            variants={variants}
          >
            <Sparkles className="w-4 h-4 text-[#5738F5]" />
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Comprehensive Platform
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-5"
            variants={variants}
          >
            Engineered for every corner of your{" "}
            <span className="bg-gradient-to-r from-[#5738F5] via-[#7C3AED] to-[#9333EA] bg-clip-text text-transparent">
              restaurant floor
            </span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto"
            variants={variants}
          >
            Stop duct-taping three different apps together. QRslice unites guest ordering, kitchen display, counter billing, and inventory in one seamless stack.
          </motion.p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* ═══ BENTO 1 (Span 2): QR Table Ordering ═══ */}
          <motion.div
            className="md:col-span-2 bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
            initial={noMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5 }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-[#5738F5]">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#5738F5] bg-violet-50 px-3 py-1 rounded-full border border-violet-200/60 flex items-center gap-1">
                  Zero App Install
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                Frictionless Digital Table Ordering
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
                Guests point their camera at the table QR code and the menu opens immediately. They browse rich food visuals, filter veg/non-veg, customize spice levels, and order in under 45 seconds.
              </p>
            </div>

            {/* Interactive Preview Widget */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Menu Demonstration
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMockVeg(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      mockVeg ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    🟢 Pure Veg
                  </button>
                  <button
                    onClick={() => setMockVeg(false)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      !mockVeg ? "bg-rose-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    🔴 Non-Veg
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${mockVeg ? "border-emerald-600" : "border-rose-600"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${mockVeg ? "bg-emerald-600" : "bg-rose-600"}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {mockVeg ? "Paneer Lababdar & Naan" : "Murg Dum Biryani Handi"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {mockVeg ? "Cottage cheese in spiced tomato butter gravy" : "Aromatic basmati rice layered with tender chicken"}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-extrabold text-slate-900">{mockVeg ? "₹295" : "₹360"}</div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Bestseller
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ BENTO 2: Kitchen Display System (KDS) ═══ */}
          <motion.div
            className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
            initial={noMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ChefHat className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  Paperless KDS
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Real-Time Kitchen Display
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Orders appear on tablets with live elapsed timers. Tap once to start prep, tap again to alert the floor team when food is hot and ready.
              </p>
            </div>

            {/* Interactive KDS Ticket */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900">TABLE T-06</span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 03:15m
                </span>
              </div>
              <div className="text-xs text-slate-700 font-medium space-y-1 mb-3">
                <div>• 2× Crisp Cold Coffee</div>
                <div>• 1× Farmhouse Truffle Pizza</div>
              </div>
              <button
                onClick={() => setTicketStatus(ticketStatus === "cooking" ? "ready" : "cooking")}
                className={`w-full py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  ticketStatus === "cooking"
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-emerald-600 text-white shadow-sm"
                }`}
              >
                {ticketStatus === "cooking" ? "Cooking (Tap to Ready)" : "Ready to Serve ✓"}
              </button>
            </div>
          </motion.div>

          {/* ═══ BENTO 3: Cashless POS & Thermal KOT ═══ */}
          <motion.div
            className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between"
            initial={noMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                  Cashier & KOT
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Lightning Fast Counter POS
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Split bills, collect payments via dynamic UPI QR, card, or cash, and automatically trigger Bluetooth 80mm/58mm thermal ticket chits.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dynamic UPI Instant Settlement
              </div>
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#5738F5]" />
                Direct Thermal KOT Bluetooth Print
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Full Offline Resilient Buffer
              </div>
            </div>
          </motion.div>

          {/* ═══ BENTO 4 (Span 2): Recipe & Stock Depletion ═══ */}
          <motion.div
            className="md:col-span-2 bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
            initial={noMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
                  <Boxes className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
                  Live Stock Engine
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                Automated Recipe & Ingredient Deduction
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
                Link ingredients to menu items. Every time a customer orders, raw inventory (dairy, coffee beans, sauces, cheese) auto-deducts. Receive proactive low-stock alerts before you run out during a dinner rush.
              </p>
            </div>

            {/* Visual Inventory Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "Coffee Beans", stock: "8.4 kg", pct: 70, color: "bg-amber-500" },
                { name: "Full Cream Milk", stock: "14 L", pct: 85, color: "bg-sky-500" },
                { name: "Paneer Fresh", stock: "2.1 kg", pct: 25, color: "bg-rose-500", alert: "Low stock alert" },
              ].map((ing, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                    <span>{ing.name}</span>
                    <span>{ing.stock}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${ing.color}`} style={{ width: `${ing.pct}%` }} />
                  </div>
                  {ing.alert && (
                    <div className="text-[10px] font-bold text-rose-600 mt-1">⚠️ {ing.alert}</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══ BENTO 5: CRM & Repeat Loyalty ═══ */}
          <motion.div
            className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-pink-300 transition-all duration-300 flex flex-col justify-between"
            initial={noMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200/60">
                  Repeat Diners
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Automatic Customer Loyalty
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Customers enter their phone number once. They accumulate reward points automatically, driving 30%+ more repeat table visits without physical punchcards.
              </p>
            </div>

            <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-200/60 text-xs">
              <div className="font-bold text-pink-900">Points Balance: 180 Pts</div>
              <div className="text-[11px] text-pink-700 mt-0.5">Eligible for ₹100 discount on next visit</div>
            </div>
          </motion.div>

          {/* ═══ BENTO 6: Multi-Role Permissions ═══ */}
          <motion.div
            className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 flex flex-col justify-between"
            initial={noMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-[#5738F5]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#5738F5] bg-violet-50 px-3 py-1 rounded-full border border-violet-200/60">
                  Staff Protection
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                PIN-Protected Roles
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Staff sign in using quick 4-digit PINs. Kitchen sees only KDS, waiters take orders, and only the owner accesses revenue and settlement ledger.
              </p>
            </div>

            <div className="flex items-center justify-around p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-700">
              <span>👨‍🍳 Chef</span>
              <span>•</span>
              <span>🧾 Cashier</span>
              <span>•</span>
              <span>👑 Owner</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
