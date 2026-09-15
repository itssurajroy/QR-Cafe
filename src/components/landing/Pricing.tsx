// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, fadeIn, springScaleIn, staggerFast, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const FEATURES = [
  "Unlimited orders & tables",
  "QR code generation & standees",
  "Kitchen Display System (KDS)",
  "Guest order tracking",
  "Menu builder with food photos",
  "Analytics & revenue dashboard",
  "Staff roles & permissions",
  "Inventory & recipe management",
  "Loyalty points & CRM",
  "Real-time order notifications",
  "Thermal printer support (KOT)",
  "Multi-device access",
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const checkVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeIn;
  const cardVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : springScaleIn;
  const container = noMotion ? { hidden: {}, visible: {} } : staggerContainer;
  const checkContainer = noMotion ? { hidden: {}, visible: {} } : staggerFast;

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm"
            variants={variants}
          >
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Transparent Pricing
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4"
            variants={variants}
          >
            One simple plan. <span className="text-[#5738F5]">Everything included.</span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
            variants={variants}
          >
            No tiers, no hidden add-ons, no zero-revenue commissions. Every restaurant outlet gets the full platform.
          </motion.p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-12"
          initial={noMotion ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-2">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                !annual
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                annual
                  ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white shadow-md shadow-[#5738F5]/25"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Annual
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                annual ? "bg-white text-[#5738F5]" : "bg-emerald-100 text-emerald-800"
              }`}>
                SAVE 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Card — Spring scale entrance */}
        <motion.div
          className="max-w-lg mx-auto"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <div className="bg-white rounded-[2.25rem] border-2 border-violet-200/90 p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(87,56,245,0.1)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200/80 rounded-full">
                  <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
                    Full Access Plan
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                  14-Day Free Trial
                </span>
              </div>

              {/* Price — AnimatePresence for smooth swap */}
              <div className="flex items-baseline gap-2 mb-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={annual ? "annual" : "monthly"}
                    className="text-5xl sm:text-6xl font-black text-slate-900 font-[family-name:var(--font-plus-jakarta)] tracking-tight"
                    initial={noMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={noMotion ? {} : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {annual ? "₹833" : "₹999"}
                  </motion.span>
                </AnimatePresence>
                <span className="text-slate-500 font-semibold text-base">/mo per outlet</span>
              </div>
              
              <AnimatePresence mode="wait">
                {annual ? (
                  <motion.p
                    key="annual-desc"
                    className="text-sm font-semibold text-slate-600 mb-8"
                    initial={noMotion ? {} : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={noMotion ? {} : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    Billed annually at ₹9,999/year.{" "}
                    <span className="line-through text-slate-400">₹11,988</span>
                  </motion.p>
                ) : (
                  <motion.p
                    key="monthly-desc"
                    className="text-sm font-semibold text-slate-600 mb-8"
                    initial={noMotion ? {} : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={noMotion ? {} : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    Billed monthly. Switch to annual billing and save ₹1,989/year.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* CTA */}
              <Link
                href="/onboarding"
                className="group w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:from-[#4828E0] hover:to-[#6D28D9] text-white font-bold rounded-2xl text-base shadow-xl shadow-[#5738F5]/25 hover:shadow-2xl hover:shadow-[#5738F5]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mb-3"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="text-center text-xs font-medium text-slate-500 mb-8">
                No credit card required. Cancel anytime.
              </p>

              {/* Feature List — Staggered checkmarks */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-6 border-t border-slate-100"
                variants={checkContainer}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT_ONCE}
              >
                {FEATURES.map((feature, i) => (
                  <motion.div key={i} className="flex items-start gap-2.5" variants={checkVariants}>
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/80">
                      <Check className="w-3 h-3 text-emerald-700" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
