"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

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

function FAQItem({ q, a }: { q: string; a: string }) {
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
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${open ? "bg-violet-50 text-[#5738F5]" : "text-slate-400 group-hover:bg-slate-100"}`}>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-[500px] pb-6" : "max-h-0"
        }`}
      >
        <p className="text-sm sm:text-[15px] text-slate-600 font-medium leading-relaxed pr-8">
          {a}
        </p>
      </div>
    </div>
  );
}

export function FAQ({ items }: { items?: { q: string; a: string }[] }) {
  const faqData = items && items.length > 0 ? items : DEFAULT_FAQ;

  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#FAF9F6] border-y border-slate-100 relative">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm">
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Answers & Clarifications
            </span>
          </div>
          <h2 className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4">
            Frequently asked questions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Everything you need to know about setting up and running QRslice.
          </p>
        </div>

        {/* Accordion */}
        <div className="bg-white rounded-3xl border border-slate-200/90 px-6 sm:px-10 shadow-sm">
          {faqData.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
