// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { ClipboardList, QrCode, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, staggerSlow, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const STEPS = [
  {
    number: "01",
    icon: ClipboardList,
    title: "1. Build Your Digital Menu",
    badge: "15-Min Setup",
    description:
      "Upload or type in your dishes with high-res food photography, dietary markers (veg, vegan, jain, non-veg), spice meters, and combo add-ons. Changes sync live in 1 second.",
    iconBg: "bg-amber-100 text-amber-700",
    borderGlow: "group-hover:border-amber-400",
  },
  {
    number: "02",
    icon: QrCode,
    title: "2. Print & Place Table Standees",
    badge: "Instant Standees",
    description:
      "One click creates customized, print-ready PDF standees and sticker sheets for all your tables. Stick them on table tents or acrylic holders.",
    iconBg: "bg-violet-100 text-[#5738F5]",
    borderGlow: "group-hover:border-[#5738F5]",
  },
  {
    number: "03",
    icon: Rocket,
    title: "3. Fire Up & Watch Revenue Flow",
    badge: "Instant Live",
    description:
      "Guests scan with their camera, dishes fire straight to your kitchen tablet, and bills settle at the table. You track sales, bestsellers, and peak hours from anywhere.",
    iconBg: "bg-emerald-100 text-emerald-700",
    borderGlow: "group-hover:border-emerald-400",
  },
];

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const numberVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeIn;
  const container = noMotion ? { hidden: {}, visible: {} } : staggerSlow;

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white relative overflow-hidden border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm"
            variants={variants}
          >
            <Rocket className="w-4 h-4 text-[#5738F5]" />
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Fast Track Deployment
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4"
            variants={variants}
          >
            Go live across all tables in <span className="text-[#5738F5]">under 30 minutes</span>.
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
            variants={variants}
          >
            No complex installations, no costly proprietary hardware, and zero technician visits needed.
          </motion.p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                className={`relative p-8 rounded-3xl bg-[#FAF9F6] border-2 border-slate-200/80 shadow-sm hover:shadow-2xl hover:bg-white ${step.borderGlow} hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group overflow-hidden`}
                variants={variants}
              >
                {/* Large step number watermark */}
                <motion.div
                  className="absolute top-4 right-6 text-6xl font-black text-slate-200 font-[family-name:var(--font-plus-jakarta)] select-none pointer-events-none group-hover:text-violet-100 transition-colors"
                  variants={numberVariants}
                >
                  {step.number}
                </motion.div>

                <div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 font-[family-name:var(--font-plus-jakarta)] relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed relative z-10">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-slate-500 group-hover:text-[#5738F5] transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Self-serve in browser
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
