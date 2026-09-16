// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Zap, Smartphone, Monitor, ShieldCheck, Laptop, Tablet, Flame } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { fadeUp, scaleIn, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function useCountUp(end: number, duration: number = 1500, inView: boolean) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * end);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    }

    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return value;
}

const STATS = [
  {
    end: 15,
    suffix: " min",
    label: "Average setup & launch time",
    badge: "Instant Setup",
    border: "border-violet-200/80 hover:border-violet-400",
    badgeColor: "bg-violet-50 text-[#5738F5]",
    decimals: 0,
  },
  {
    end: 0,
    prefix: "",
    suffix: "%",
    label: "Commission on customer food bills",
    badge: "Zero Cuts",
    border: "border-amber-200/80 hover:border-amber-400",
    badgeColor: "bg-amber-50 text-amber-800",
    decimals: 0,
    isZero: true,
  },
  {
    end: 24,
    prefix: "+",
    suffix: "%",
    label: "Higher average ticket with photos",
    badge: "Revenue Boost",
    border: "border-emerald-200/80 hover:border-emerald-400",
    badgeColor: "bg-emerald-50 text-emerald-800",
    decimals: 0,
  },
  {
    end: 99.9,
    suffix: "%",
    label: "High reliability & offline buffering",
    badge: "Always Online",
    border: "border-sky-200/80 hover:border-sky-400",
    badgeColor: "bg-sky-50 text-sky-800",
    decimals: 1,
  },
];

const VENUE_TYPES = [
  "Specialty Coffee Cafés",
  "Casual & Fine Dining",
  "QSRs & Food Courts",
  "Rooftop Lounges & Bars",
  "Bakeries & Dessert Bars",
  "Drive-thrus & Takeaway",
];

export function Intro() {
  const prefersReducedMotion = useReducedMotion();
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  const noMotion = prefersReducedMotion;
  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const cardVariants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : scaleIn;
  const container = noMotion ? { hidden: {}, visible: {} } : staggerContainer;

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200/80 rounded-full mb-6 shadow-sm"
            variants={variants}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              The Restaurant Operating System
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-[2.75rem] lg:text-5xl font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6"
            variants={variants}
          >
            One unified digital spine for your{" "}
            <span className="text-[#5738F5]">tables</span>,{" "}
            <span className="text-amber-600">kitchen</span>, and{" "}
            <span className="text-emerald-600">cashier</span>.
          </motion.h2>

          <motion.p
            className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-8"
            variants={variants}
          >
            QRslice eliminates paper chits, shouting servers, and misplaced orders with calm, instantaneous digital orchestration. From QR scan to hot kitchen ticket to one-tap payment, every action syncs in real time.
          </motion.p>

          {/* Café Format Badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto"
            variants={variants}
          >
            {VENUE_TYPES.map((type, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-full text-xs font-bold text-slate-700 shadow-sm hover:border-[#5738F5]/40 hover:text-[#5738F5] transition-colors"
              >
                {type}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Stats Row - Animated counters + staggered card entrance */}
        <motion.div
          ref={statsRef}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-5xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} inView={statsInView} variants={cardVariants} />
          ))}
        </motion.div>

        {/* Zero Hardware Lock-in Bar */}
        <div className="mt-14 max-w-4xl mx-auto p-5 sm:p-6 bg-gradient-to-r from-violet-50/70 via-purple-50/40 to-slate-50 border border-violet-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5738F5] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#5738F5]/20">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Zero Proprietary Hardware Required</div>
              <div className="text-xs text-slate-500">Runs directly in any browser on Android tablets, iPads, Windows laptops, or phones.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5738F5] bg-white px-3 py-1.5 rounded-xl border border-violet-200 shadow-sm shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Bluetooth Thermal Ready
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, inView, variants }: { stat: (typeof STATS)[0]; inView: boolean; variants: any }) {
  const count = useCountUp(stat.end, 1500, inView);

  const display = stat.isZero
    ? "0%"
    : stat.decimals > 0
    ? `${stat.prefix ?? ""}${count.toFixed(stat.decimals)}${stat.suffix}`
    : `${stat.prefix ?? ""}${Math.round(count)}${stat.suffix}`;

  return (
    <motion.div
      className={`p-6 sm:p-7 rounded-3xl border-2 ${stat.border} bg-white shadow-sm hover:shadow-lg transition-all duration-300 text-center flex flex-col items-center justify-between group`}
      variants={variants}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${stat.badgeColor} mb-4`}>
        {stat.badge}
      </span>
      <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-plus-jakarta)] mb-2 group-hover:scale-105 transition-transform">
        {display}
      </div>
      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
        {stat.label}
      </p>
    </motion.div>
  );
}
