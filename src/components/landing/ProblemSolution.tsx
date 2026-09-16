// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { XCircle, CheckCircle2, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const OLD_WAY = [
  "Customers wait 10+ minutes waving for a paper menu",
  "Waiters scribble chits with illegible handwriting",
  "Missing or lost KOTs cause frantic shouting matches with the kitchen",
  "Out-of-stock items get ordered, forcing embarrassing apology visits",
  "Cashiers run around printing multiple bills and collecting manual UPI transfers",
];

const QRSLICE_WAY = [
  "Instant QR scan directly opens full menu with mouth-watering photos",
  "Orders stream digitally to kitchen tablets with exact customer notes",
  "Automated elapsed timers ensure tickets are prepared in order",
  "Sold-out items vanish from all digital menus in 1 tap in real time",
  "Seamless settlement at table or counter with direct UPI & split bills",
];

export function ProblemSolution() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;
  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;

  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border border-rose-200/80 rounded-full mb-4 shadow-sm"
            variants={variants}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Chaos vs Clarity
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-5"
            variants={variants}
          >
            Restaurant operations shouldn&apos;t feel like a{" "}
            <span className="text-rose-600 underline decoration-rose-300 decoration-wavy underline-offset-4">
              daily emergency
            </span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
            variants={variants}
          >
            Running a busy dinner rush with paper chits and shouting creates friction everywhere. Here is what shifts when you bring digital order flow to your tables:
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Old Way Card */}
          <motion.div
            className="rounded-3xl border-2 border-rose-100 bg-gradient-to-b from-rose-50/40 to-white p-7 sm:p-9 shadow-sm relative overflow-hidden"
            initial={noMotion ? {} : { opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose-100">
              <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-100/80 px-3 py-1 rounded-full">
                The Paper Chit Chaos
              </span>
              <span className="text-2xl">⏳</span>
            </div>

            <div className="space-y-4">
              {OLD_WAY.map((point, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-slate-700 font-medium leading-snug">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-rose-100/60 rounded-2xl border border-rose-200/60 text-xs text-rose-800 font-semibold">
              Result: 18–25 minutes wasted per table, stressed waiters, and lost repeat customers.
            </div>
          </motion.div>

          {/* QRslice Way Card */}
          <motion.div
            className="rounded-3xl border-2 border-[#5738F5]/40 bg-gradient-to-b from-violet-50/40 via-white to-white p-7 sm:p-9 shadow-xl shadow-violet-500/5 relative overflow-hidden"
            initial={noMotion ? {} : { opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#5738F5]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-violet-100">
              <span className="text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#5738F5] to-[#7C3AED] px-3 py-1 rounded-full shadow-sm">
                The QRslice Streamlined Flow
              </span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-4">
              {QRSLICE_WAY.map((point, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-slate-800 font-bold leading-snug">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-200/70 text-xs text-emerald-800 font-bold flex items-center justify-between">
              <span>Result: +24% average check size, 16m faster table turns, peaceful kitchen.</span>
              <span className="text-base">🚀</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
