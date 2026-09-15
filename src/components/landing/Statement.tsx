// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Statement() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const quoteVariants = noMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
        },
      };

  const attrVariants = noMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
        },
      };

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white border-y border-slate-100">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <motion.blockquote
          className="text-2xl sm:text-4xl lg:text-[2.5rem] font-extrabold leading-[1.25] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)]"
          variants={quoteVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          &ldquo;We built QRslice because every café owner we met was{" "}
          <span className="text-[#5738F5]">drowning in paper chits</span> and{" "}
          <span className="text-amber-600">shouting across the kitchen</span>.
          There had to be a calmer, faster way.&rdquo;
        </motion.blockquote>
        <motion.div
          className="mt-8 flex items-center justify-center gap-3.5"
          variants={attrVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5738F5] to-[#7C3AED] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5738F5]/20">
            QR
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-900">QRslice Product Team</div>
            <div className="text-xs font-medium text-slate-500">Made with ☕ in India for hospitality teams</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
