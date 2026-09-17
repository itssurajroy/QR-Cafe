// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeIn, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Book a Demo", href: "/contact" },
    { label: "Kitchen Display", href: "/pos" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Refund Policy", href: "/legal/refund" },
    { label: "Cookie Policy", href: "/legal/cookies" },
  ],
};

export function Footer() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeIn;

  return (
    <motion.footer
      className="bg-white border-t border-slate-200/80 pt-16 pb-12"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <QrSliceLogo size="md" variant="full" className="group-hover:scale-105 transition-transform" />
            </Link>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px] mb-4">
              QR ordering, without the chaos. Calm, real-time operating system for hospitality teams.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-[family-name:var(--font-plus-jakarta)]">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} QRslice. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>Built in India</span>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#5738F5] transition-colors">Book a Demo</Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}