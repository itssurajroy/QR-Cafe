"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white border-b border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]"
          : "bg-white/95 border-b border-slate-100"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="QRslice"
            className="h-8 sm:h-9 w-auto group-hover:scale-105 transition-transform duration-200"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-2xl border border-slate-200/60">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#5738F5] rounded-xl hover:bg-white hover:shadow-sm transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/c/wah-ji-wah"
            className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl transition-all duration-150 flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Demo
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-[#5738F5] rounded-xl hover:bg-slate-100/80 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="px-5 py-2.5 bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:from-[#4828E0] hover:to-[#6D28D9] text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#5738F5]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 shadow-md shadow-[#5738F5]/20"
          >
            Start Free Trial
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

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-2xl">
          <div className="px-5 py-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-bold text-slate-700 hover:text-[#5738F5] hover:bg-violet-50 rounded-xl transition-all"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/c/wah-ji-wah"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-amber-800 bg-amber-50 rounded-xl border border-amber-200/80"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              View Wah Ji Wah Demo Store
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
                className="block text-center px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#5738F5] to-[#7C3AED] rounded-xl shadow-md shadow-[#5738F5]/25"
              >
                Start Free Trial →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
