"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

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

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm">
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Transparent Pricing
            </span>
          </div>
          <h2 className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4">
            One simple plan. <span className="text-[#5738F5]">Everything included.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            No tiers, no hidden add-ons, no zero-revenue commissions. Every restaurant outlet gets the full platform.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
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
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
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

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 font-[family-name:var(--font-plus-jakarta)] tracking-tight">
                  {annual ? "₹833" : "₹999"}
                </span>
                <span className="text-slate-500 font-semibold text-base">/mo per outlet</span>
              </div>
              
              {annual ? (
                <p className="text-sm font-semibold text-slate-600 mb-8">
                  Billed annually at ₹9,999/year.{" "}
                  <span className="line-through text-slate-400">₹11,988</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-600 mb-8">
                  Billed monthly. Switch to annual billing and save ₹1,989/year.
                </p>
              )}

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

              {/* Feature List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-6 border-t border-slate-100">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/80">
                      <Check className="w-3 h-3 text-emerald-700" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
