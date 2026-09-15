// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, slideInLeft, staggerTestimonials, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TESTIMONIALS = [
  {
    quote:
      "We cut order wait times by 40% in the first week. Our staff finally has time to focus on hospitality and food quality instead of scribbling chits.",
    name: "Priya Sharma",
    role: "Owner",
    cafe: "Chai & Co., Mumbai",
    metric: "40% Faster Table Turn",
    rating: 5,
    initial: "P",
    color: "from-amber-500 to-orange-500",
  },
  {
    quote:
      "The kitchen display changed everything. No more lost paper chits, no shouting waiters, and zero missed orders. Kitchen runs like clockwork.",
    name: "Rahul Verma",
    role: "Head of Ops",
    cafe: "Street Bites, Delhi",
    metric: "Zero Lost Orders",
    rating: 5,
    initial: "R",
    color: "from-blue-600 to-indigo-600",
  },
  {
    quote:
      "Set up our entire 80-dish menu in one afternoon. Our guests genuinely love scanning the QR and ordering with photos — it feels so high-end.",
    name: "Anjali Mehta",
    role: "Founder",
    cafe: "Brew House, Bangalore",
    metric: "Live Same Day",
    rating: 5,
    initial: "A",
    color: "from-emerald-600 to-teal-600",
  },
];

export function Testimonials() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const headerVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const cardVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : slideInLeft;
  const headerContainer = noMotion ? { hidden: {}, visible: {} } : { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
  const container = noMotion ? { hidden: {}, visible: {} } : staggerTestimonials;

  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-[#FAF9F6] border-b border-slate-100 relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          variants={headerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm"
            variants={headerVariants}
          >
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Proven Across 500+ Outlets
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4"
            variants={headerVariants}
          >
            Trusted by restaurant & café owners across India
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
            variants={headerVariants}
          >
            From Mumbai specialty cafés to Bangalore microbreweries — see why operators rely on QRslice.
          </motion.p>
        </motion.div>

        {/* Testimonial cards — cascade from left */}
        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-200"
              variants={cardVariants}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200/80 px-3 py-1 text-xs font-bold text-[#5738F5]">
                    {t.metric}
                  </span>
                </div>
                <blockquote className="leading-relaxed text-slate-700 text-base font-medium mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>

              <div className="flex items-center gap-3.5 border-t border-slate-100 pt-5 mt-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} text-white font-black text-sm flex items-center justify-center shadow-sm`}>
                  {t.initial}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    {t.name}
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {t.role}, {t.cafe}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
