// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const DEFAULT_FAQ = [
  {
    q: "Do guests need to download an app?",
    a: "No. QRslice opens in the guest's browser, so they can scan, browse, and order in seconds without an app or account.",
  },
  {
    q: "What hardware do I need?",
    a: "Any phone, tablet, or laptop with a browser works. Add a Bluetooth thermal printer for KOTs or a tablet/TV for the kitchen display.",
  },
  {
    q: "Can I use my existing POS?",
    a: "Yes. QRslice is designed to sit alongside your current setup, with exports, webhooks, and a flexible API for the workflows you already trust.",
  },
  {
    q: "How long does setup take?",
    a: "Most cafés can go live in around 30 minutes. Import your menu, print table QR codes, and invite your team.",
  },
  {
    q: "What happens after the free trial?",
    a: "You get the full system for 14 days with no credit card required. Continue for ₹999 per month per outlet, or cancel anytime.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. QRslice uses industry-standard encryption, Supabase row-level security, and never shares your data with third parties.",
  },
];

function FAQItem({ q, a, noMotion }: { q: string; a: string; noMotion: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 sm:py-6 text-left group cursor-pointer"
      >
        <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#5738F5] transition-colors pr-8">
          {q}
        </span>
        <motion.div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${open ? "bg-violet-50 text-[#5738F5]" : "text-slate-400 group-hover:bg-slate-100"}`}
          animate={{ rotate: open ? 180 : 0 }}
          transition={noMotion ? { duration: 0 } : { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden"
            initial={noMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={noMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={noMotion ? { duration: 0 } : { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-sm sm:text-[15px] text-slate-600 font-medium leading-relaxed pr-8 pb-6">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ({ items }: { items?: { q: string; a: string }[] }) {
  const faqData = items && items.length > 0 ? items : DEFAULT_FAQ;
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;
  const container = noMotion ? { hidden: {}, visible: {} } : staggerContainer;

  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#FAF9F6] border-y border-slate-100 relative">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
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
              Answers & Clarifications
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4"
            variants={variants}
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
            variants={variants}
          >
            Everything you need to know about setting up and running QRslice.
          </motion.p>
        </motion.div>

        {/* Accordion — scroll-reveal wrapper */}
        <motion.div
          className="bg-white rounded-3xl border border-slate-200/90 px-6 sm:px-10 shadow-sm"
          variants={noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {faqData.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} noMotion={noMotion} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
