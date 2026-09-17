// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, springScaleIn, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function CTA() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const cardVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : springScaleIn;
  const container = noMotion ? { hidden: {}, visible: {} } : staggerContainer;

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          className="rounded-[2.5rem] bg-gradient-to-br from-violet-50/90 via-white to-amber-50/60 border-2 border-violet-200/90 p-10 sm:p-16 text-center relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(87,56,245,0.08)]"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {/* Subtle light glow accents */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-200/30 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-200/30 rounded-full blur-[80px] pointer-events-none" />

          <motion.div
            className="relative z-10 max-w-2xl mx-auto"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100/70 border border-violet-200 rounded-full mb-6 shadow-sm"
              variants={variants}
            >
              <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
                Get Started in 30 Minutes
              </span>
            </motion.div>

            <motion.h2
              className="text-3xl sm:text-[2.75rem] lg:text-5xl font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6"
              variants={variants}
            >
              Ready to run your restaurant{" "}
              <span className="text-[#5738F5]">without the chaos?</span>
            </motion.h2>

            <motion.p
              className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-10 max-w-xl mx-auto"
              variants={variants}
            >
              Join hundreds of cafés and restaurants across India who replaced lost paper chits
              with a calm, real-time kitchen and higher average order values.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4"
              variants={variants}
            >
              <Link
                href="/onboarding"
                className="group px-8 py-4 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:from-[#4828E0] hover:to-[#6D28D9] text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[#5738F5]/25 hover:shadow-2xl hover:shadow-[#5738F5]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 text-slate-800 bg-white font-bold rounded-2xl text-base border-2 border-slate-200/90 hover:border-[#5738F5]/40 hover:bg-violet-50/50 hover:text-[#5738F5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-[#5738F5]" />
                Book a Demo
              </Link>
            </motion.div>

            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500"
              variants={variants}
            >
              <span>✓ No credit card required</span>
              <span>✓ Instant setup</span>
              <span>✓ Cancel anytime</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
