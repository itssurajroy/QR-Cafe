// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white border-b border-slate-200 shadow-sm"
          : "bg-white border-b border-slate-100"
      }`}
      initial={false}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <QrSliceLogo size="md" variant="full" className="group-hover:scale-105 transition-transform duration-200" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#5738F5] hover:bg-white rounded-xl transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/contact"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white/80 hover:bg-white hover:text-[#5738F5] border border-slate-200/80 rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-[#5738F5]" />
            Book a Demo
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-[#5738F5] hover:bg-slate-100 rounded-xl transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="px-5 py-2.5 bg-[#5738F5] hover:bg-[#4828E0] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden bg-white border-b border-slate-200 shadow-xl overflow-hidden"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="px-5 py-6 space-y-1">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-base font-bold text-slate-700 hover:text-[#5738F5] hover:bg-slate-100 rounded-xl transition-all"
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-800 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100"
              >
                <Calendar className="w-4 h-4 text-[#5738F5]" />
                Book a Demo
              </Link>
              <div className="pt-4 space-y-3 border-t border-slate-100 mt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-bold text-white bg-[#5738F5] rounded-xl shadow-md"
                >
                  Start Free Trial →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
