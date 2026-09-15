// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { fadeUp, scaleIn, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ─── Counter Hook ─── */
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
      // Ease-out cubic
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
  { end: 30, suffix: " min", label: "Average setup time", badge: "Fast Launch", border: "border-violet-200 hover:border-violet-400", badgeColor: "bg-violet-50 text-[#5738F5]", decimals: 0 },
  { end: 0, suffix: "", label: "Apps for guests to install", badge: "Zero Friction", border: "border-amber-200 hover:border-amber-400", badgeColor: "bg-amber-50 text-amber-800", decimals: 0, isZero: true },
  { end: 999, prefix: "₹", suffix: "", label: "Flat per outlet / month", badge: "Zero Commission", border: "border-emerald-200 hover:border-emerald-400", badgeColor: "bg-emerald-50 text-emerald-800", decimals: 0 },
  { end: 99.9, suffix: "%", label: "Uptime & offline sync", badge: "Always On", border: "border-sky-200 hover:border-sky-400", badgeColor: "bg-sky-50 text-sky-800", decimals: 1 },
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
              The Hospitality OS
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-[2.75rem] lg:text-5xl font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6"
            variants={variants}
          >
            One platform that connects your{" "}
            <span className="text-[#5738F5]">tables</span>,{" "}
            <span className="text-amber-600">kitchen</span>, and{" "}
            <span className="text-emerald-600">business</span>.
          </motion.h2>

          <motion.p
            className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto"
            variants={variants}
          >
            QRslice replaces paper chits, shouting waiters, and lost tickets with a calm, seamless digital spine
            for your entire restaurant. From scan to serve to settlement — everything flows in real-time.
          </motion.p>
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
            <StatCard
              key={i}
              stat={stat}
              inView={statsInView}
              noMotion={noMotion}
              cardVariants={cardVariants}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({
  stat,
  inView,
  noMotion,
  cardVariants,
}: {
  stat: (typeof STATS)[number];
  inView: boolean;
  noMotion: boolean;
  cardVariants: typeof scaleIn;
}) {
  const count = useCountUp(stat.end, noMotion ? 0 : 1500, inView);

  const displayValue = stat.isZero
    ? "0"
    : `${stat.prefix || ""}${stat.decimals > 0 ? count.toFixed(stat.decimals) : Math.round(count)}${stat.suffix}`;

  return (
    <motion.div
      className={`p-6 rounded-3xl bg-[#FAF9F6] border ${stat.border} hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-200 text-center relative flex flex-col justify-between`}
      variants={cardVariants}
    >
      <div className="mb-3">
        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${stat.badgeColor}`}>
          {stat.badge}
        </span>
      </div>
      <div className="text-3xl sm:text-4xl font-black text-slate-900 font-[family-name:var(--font-plus-jakarta)] tracking-tight tabular-nums">
        {displayValue}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-2">
        {stat.label}
      </div>
    </motion.div>
  );
}
