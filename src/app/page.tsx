"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CoffeeIcon, CheckCircleIcon } from "@/components/Icons";

const TESTIMONIALS = [
  {
    quote: "Our table turn speed jumped by 35% in the first weekend. Chefs love the voice call bells and guests love paying cash without waiting for a bill book.",
    author: "Chef Vikram Mehta",
    role: "Founder, Roastery & Kitchen",
    tables: "18 Tables • Mumbai",
    rating: "★★★★★",
  },
  {
    quote: "WhatsApp e-bills saved us ₹4,000/month on thermal rolls and Twilio SMS. Plus our Google Reviews skyrocketed to 4.9 stars!",
    author: "Ananya Deshmukh",
    role: "Owner, Bean & Brew Café",
    tables: "12 Tables • Pune",
    rating: "★★★★★",
  },
  {
    quote: "Onboarding took literally 45 seconds. The POS keyboard shortcuts and live KDS sync make peak brunch hours completely stress-free.",
    author: "Rohan Kapoor",
    role: "Managing Director, Crave Bistro",
    tables: "24 Tables • Bengaluru",
    rating: "★★★★★",
  },
];

const FAQS = [
  {
    q: "How do table QR codes work for my guests?",
    a: "Every table has a dedicated QR code (e.g. /c/your-cafe/t/01). Customers simply point their phone camera to open your interactive menu in mobile Safari/Chrome. No app download or account signup required.",
  },
  {
    q: "How does the 1-Click WhatsApp E-Receipt work without API fees?",
    a: "When cashiers settle orders at the POS, the customer's phone number is auto-filled. Clicking 'Send WhatsApp' opens WhatsApp Web/Mobile with a formatted itemized receipt, GST breakdown, and Google Review link with zero third-party messaging costs.",
  },
  {
    q: "What hardware is required to run the Kitchen KDS & POS?",
    a: "None! QR Café runs in any standard web browser. You can use any tablet, iPad, phone, Android TV, or existing desktop register without buying proprietary POS terminals.",
  },
  {
    q: "Can I print 80mm thermal receipts and export GST reports?",
    a: "Yes. The POS terminal includes 1-click tax-compliant 80mm thermal receipt printing and downloadable PDF invoices with CGST/SGST splits and your business GSTIN.",
  },
  {
    q: "What happens after the 7-day free trial?",
    a: "You get full, unrestricted access to all features for 7 days. If you love it, continue for a flat ₹799/month with unlimited tables, unlimited menu items, and no hidden commission fees.",
  },
];

export default function Home() {
  // Interactive Revenue & ROI Calculator State
  const [dailyTables, setDailyTables] = useState<number>(40);
  const [avgTicket, setAvgTicket] = useState<number>(420);

  const monthlyGrossRevenue = dailyTables * avgTicket * 30;
  const monthlyRevenueLift = Math.round(monthlyGrossRevenue * 0.18);
  const annualGains = monthlyRevenueLift * 12;

  // Interactive Live Workflow Simulator State
  const [activeStep, setActiveStep] = useState<number>(1);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Social Proof Activity Notification Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg] = useState({ name: "The French Roastery", table: "Table #04", time: "Just now" });

  // Animated Counters
  const [countersStarted, setCountersStarted] = useState(false);
  const [cafeCount, setCafeCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  const countersRef = useRef<HTMLDivElement>(null);

  // Testimonial Auto-Carousel
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setToastVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Testimonial auto-advance
  useEffect(() => {
    const iv = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 3000);
    return () => clearInterval(iv);
  }, []);

  // Animated counters via IntersectionObserver
  useEffect(() => {
    if (!countersRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !countersStarted) {
          setCountersStarted(true);
          // Animate café count 0 → 500
          let c = 0; const ci = setInterval(() => { c += 10; setCafeCount(Math.min(c, 500)); if (c >= 500) clearInterval(ci); }, 20);
          // Animate order count 0 → 2000000
          let o = 0; const oi = setInterval(() => { o += 50000; setOrderCount(Math.min(o, 2000000)); if (o >= 2000000) clearInterval(oi); }, 20);
          // Animate revenue 0 → 10
          let r = 0; const ri = setInterval(() => { r += 0.2; setRevenueCount(parseFloat(Math.min(r, 10).toFixed(1))); if (r >= 10) clearInterval(ri); }, 20);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(countersRef.current);
    return () => obs.disconnect();
  }, [countersStarted]);

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-stone-800 flex flex-col justify-between selection:bg-amber-500 selection:text-black antialiased relative overflow-hidden font-sans">
      {/* Background Ambient Grid & Radial Halos */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Floating Live Social Proof Toast */}
      {toastVisible && (
        <div className="fixed bottom-6 left-6 z-50 bg-white/95 border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-500 max-w-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-base shadow-md shadow-amber-500/20 shrink-0">
            ☕
          </div>
          <div className="text-xs">
            <p className="font-bold text-stone-900 leading-tight">{toastMsg.name}</p>
            <p className="text-[11px] text-stone-500">Order placed from <span className="text-amber-400 font-semibold">{toastMsg.table}</span> • {toastMsg.time}</p>
          </div>
          <button
            onClick={() => setToastVisible(false)}
            className="text-stone-500 hover:text-stone-900 text-xs pl-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-stone-200 backdrop-blur-2xl sticky top-0 z-50 bg-white/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <CoffeeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-stone-900 block">
                QR Café
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#D97706] font-bold block -mt-1">
                Restaurant OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-stone-500">
            <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
            <a href="#simulator" className="hover:text-stone-900 transition-colors">How It Works</a>
            <a href="#calculator" className="hover:text-stone-900 transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-stone-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs font-bold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Start Free 7-Day Trial &rarr;
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-50"
              aria-label="Menu"
            >
              {mobileNavOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-6 py-4 space-y-3 shadow-lg">
            <a href="#features" onClick={() => setMobileNavOpen(false)} className="block text-sm font-bold text-stone-700 hover:text-stone-900">Features</a>
            <a href="#simulator" onClick={() => setMobileNavOpen(false)} className="block text-sm font-bold text-stone-700 hover:text-stone-900">How It Works</a>
            <a href="#calculator" onClick={() => setMobileNavOpen(false)} className="block text-sm font-bold text-stone-700 hover:text-stone-900">ROI Calculator</a>
            <a href="#pricing" onClick={() => setMobileNavOpen(false)} className="block text-sm font-bold text-stone-700 hover:text-stone-900">Pricing</a>
            <a href="#faqs" onClick={() => setMobileNavOpen(false)} className="block text-sm font-bold text-stone-700 hover:text-stone-900">FAQ</a>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <Link href="/login" className="flex-1 py-2.5 rounded-xl bg-white border border-stone-200 text-center text-sm font-bold text-stone-700">Sign In</Link>
              <Link href="/onboarding" className="flex-1 py-2.5 rounded-xl bg-[#D97706] text-white text-center text-sm font-black">Start Trial →</Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 flex flex-col items-center space-y-28 relative z-10">
        
        {/* HERO SECTION */}
        <section className="space-y-6 max-w-4xl text-center pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            The #1 Operating System for Modern Dine-In Cafés
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-stone-900 leading-[1.1]">
            Turn Every Table into an <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              Autonomous Revenue Engine
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Warm, welcoming service with contactless QR ordering, gentle voice KDS for the kitchen, and handwritten-bill-free POS — hospitality first, revenue follows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/onboarding"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>🚀 Launch Café in 60s (Free 7-Day Trial)</span>
            </Link>
            <Link
              href="/c/curry-leaf/t/T1"
              className="px-6 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-sm transition-colors shadow-md flex items-center gap-2"
            >
              <span>📱 Live Table QR Demo &rarr;</span>
            </Link>
          </div>

          {/* Animated Counter Stats */}
          <div ref={countersRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
            {[
              { value: `${cafeCount}+`, label: "Cafés & Restaurants", sub: "Live across India", icon: "☕" },
              { value: `${(orderCount / 1000).toFixed(0)}K+`, label: "Orders Processed", sub: "This month", icon: "🧧" },
              { value: `₹${revenueCount}Cr+`, label: "Revenue Generated", sub: "For our partners", icon: "💰" },
              { value: "4.9★", label: "Average Rating", sub: "From café owners", icon: "🌟" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl bg-white border border-stone-200 backdrop-blur-md text-center hover:border-amber-500/30 transition-all">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <span className="text-2xl font-black text-stone-900 font-mono">{stat.value}</span>
                <p className="text-xs text-amber-400 font-bold mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {[
              { icon: "🇮🇳", label: "Made in India" },
              { icon: "🧾", label: "GST Compliant" },
              { icon: "📱", label: "Works on Any Device" },
              { icon: "💰", label: "No Commission Fees" },
              { icon: "🔒", label: "FSSAI Safe" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-500">
                <span>{badge.icon}</span>
                <span className="font-bold">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6-CARD HIGH-TECH BENTO GRID */}
        <section id="features" className="w-full space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Next-Gen Restaurant Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
              Everything Your Floor Needs to Excel
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto">
              Built on Next.js Turbopack, Postgres Realtime channels, and Web Speech synthesis for ultra-responsive performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Voice KDS (Double width on desktop) */}
            <div className="md:col-span-2 bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                🔊
              </div>
              <h3 className="text-xl font-black text-stone-900">Realtime Spoken Voice KDS &amp; Call Bells</h3>
              <p className="text-xs text-stone-500 leading-relaxed max-w-lg">
                Kitchen tablets ring audio chimes and speak out loud: <em>&quot;Table 3 needs Water!&quot;</em> or <em>&quot;New Order for Table 1!&quot;</em>. Kanban columns auto-sort tickets with urgency heatmaps and flashing alerts past 15 minutes.
              </p>
              <div className="bg-stone-950 border border-stone-200/90 rounded-2xl p-3.5 flex items-center justify-between font-mono text-xs">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  KDS Line Station Live
                </span>
                <span className="text-amber-400">Ticket #A-104 • ⏱ 02m 15s</span>
              </div>
            </div>

            {/* Bento Card 2: 1-Click WhatsApp E-Bills */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="text-xl font-black text-stone-900">100% Free WhatsApp E-Bills</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Cashiers send itemized receipts directly to customer WhatsApp in 1 click. Zero monthly Twilio or Meta API charges.
              </p>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-200 text-[11px] text-stone-600 font-mono">
                🧾 Bill #POS-482 • ₹525.00 ✓
              </div>
            </div>

            {/* Bento Card 3: 5★ Google Review Engine */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                ⭐
              </div>
              <h3 className="text-xl font-black text-stone-900">5★ Google Review Capture</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                When meals are delivered, 4★ and 5★ ratings automatically open the café&apos;s direct Google Business Review page.
              </p>
              <span className="text-[11px] text-amber-400 font-bold block bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center">
                Loved our food? Rate on Google ★★★★★
              </span>
            </div>

            {/* Bento Card 4: Table Management */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                💎
              </div>
              <h3 className="text-xl font-black text-stone-900">Table Management</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Track table occupancy, view live order status, and clear tables instantly for faster turnaround.
              </p>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-200 text-[11px] text-emerald-400 font-bold font-mono">
                Table #04 Cleared Successfully
              </div>
            </div>

            {/* Bento Card 5: GST Invoicing & Quick Cash POS */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                🧾
              </div>
              <h3 className="text-xl font-black text-stone-900">GST Invoicing &amp; Cash POS</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Quick tender buttons (₹100, ₹200, ₹500, ₹2000, Exact), CGST/SGST 5% splits, and standard 80mm thermal receipt printing.
              </p>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-200 text-[11px] text-stone-600 font-mono">
                CGST 2.5% + SGST 2.5% Tax Breakdown
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE 3-STEP WORKFLOW SIMULATOR */}
        <section id="simulator" className="w-full max-w-4xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Interactive Operating Flow
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              Experience the 3-Step Live Floor Synchronizer
            </h2>
            <p className="text-xs text-stone-500">
              Click each step to preview how guests, kitchen chefs, and cashiers stay seamlessly synchronized.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
            {/* Step Selection Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeStep === 1
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <span>📱 1. Table QR Order</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeStep === 2
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <span>👨‍🍳 2. Kitchen Voice KDS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeStep === 3
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <span>🧾 3. POS Cash &amp; WhatsApp</span>
              </button>
            </div>

            {/* Step 1 Preview Card */}
            {activeStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Step 1: Contactless Self-Ordering
                  </span>
                  <h3 className="text-xl font-black text-stone-900">Guests Scan, Browse &amp; Place Orders in Seconds</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Customers scan table-specific QR tent stands to view bilingual English/Hindi menus with dietary veg tags, custom cooking notes, and service call bells (Need Water / Call Waiter).
                  </p>
                  <ul className="space-y-1.5 text-xs text-stone-600">
                    <li className="flex items-center gap-2">✓ No app download needed (instant mobile browser)</li>
                    <li className="flex items-center gap-2">✓ Cash-at-Counter confirmation notice</li>
                    <li className="flex items-center gap-2">✓ Automated WhatsApp e-bill capture</li>
                  </ul>
                </div>
                <div className="bg-stone-950 border border-stone-200 rounded-2xl p-4 text-left space-y-3 font-sans">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-amber-400">Table #04 Dine-In</span>
                    <span className="text-[10px] text-stone-500">Live Browser</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-stone-700">
                      <span>1x Hazelnut Cold Brew</span>
                      <span className="font-mono text-amber-400">₹220</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-700">
                      <span>1x Artisan Truffle Pizza</span>
                      <span className="font-mono text-amber-400">₹380</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs font-black">
                    <span>Total: ₹600</span>
                    <span className="px-2 py-1 rounded-lg bg-amber-500 text-stone-950 text-[10px]">Order Sent ✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Preview Card */}
            {activeStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Step 2: Voice-Enabled Kitchen KDS
                  </span>
                  <h3 className="text-xl font-black text-stone-900">Chefs Hear Voice Announcements &amp; Track Tickets</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    The kitchen display screen rings audio chimes and speaks out loud: <em>&quot;New Order for Table 4!&quot;</em> or <em>&quot;Table 2 needs Water!&quot;</em>. Kanban columns auto-sort tickets with urgency heatmaps.
                  </p>
                  <ul className="space-y-1.5 text-xs text-stone-600">
                    <li className="flex items-center gap-2">✓ Realtime WebSocket syncing</li>
                    <li className="flex items-center gap-2">✓ Browser-native spoken voice alerts</li>
                    <li className="flex items-center gap-2">✓ Color-coded wait time alerts past 15 mins</li>
                  </ul>
                </div>
                <div className="bg-stone-950 border border-stone-200 rounded-2xl p-4 text-left space-y-3">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      KDS Line Station
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">⏱ 02m 14s</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                    <div className="text-xs font-extrabold text-stone-900">Ticket #A-492 • Table 4</div>
                    <div className="text-[11px] text-stone-600">• Hazelnut Cold Brew (Less Sugar)</div>
                    <div className="text-[11px] text-stone-600">• Artisan Truffle Pizza (Extra Crisp)</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-black text-[10px]">
                      Mark Cooking 🔥
                    </button>
                    <button className="flex-1 py-1.5 rounded-lg bg-stone-100 text-stone-600 font-bold text-[10px]">
                      Mark Ready 🔔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 Preview Card */}
            {activeStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Step 3: Fast Cashier Settle &amp; Reviews
                  </span>
                  <h3 className="text-xl font-black text-stone-900">1-Click Cash Settlement, WhatsApp Bills &amp; Google Reviews</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Cashiers settle open table tabs with instant change calculators, print 80mm thermal receipts with GST breakdowns, and dispatch digital WhatsApp receipts with direct Google Review links.
                  </p>
                  <ul className="space-y-1.5 text-xs text-stone-600">
                    <li className="flex items-center gap-2">✓ 100% Free WhatsApp Web E-Receipts (Zero API fees)</li>
                    <li className="flex items-center gap-2">✓ Automatic status syncing across devices</li>
                    <li className="flex items-center gap-2">✓ 4★ and 5★ reviews routed to Google Business</li>
                  </ul>
                </div>
                <div className="bg-stone-950 border border-stone-200 rounded-2xl p-4 text-left space-y-2.5">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-amber-400">POS Cashier Settle</span>
                    <span className="text-[10px] text-emerald-400 font-bold">PAID IN CASH ✓</span>
                  </div>
                  <div className="text-xs text-stone-600 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold text-stone-900">₹630.00</span>
                    </div>

                  </div>
                  <div className="pt-2 flex gap-2">
                    <button className="flex-1 py-2 rounded-lg bg-emerald-600 text-stone-900 font-black text-xs flex items-center justify-center gap-1">
                      <span>💬 WhatsApp Bill</span>
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs">
                      🖨️ Thermal Print
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INTERACTIVE ROI CALCULATOR */}
        <section id="calculator" className="w-full max-w-4xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Interactive ROI Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              Calculate Your Monthly Revenue Growth
            </h2>
            <p className="text-xs text-stone-500">
              See how autonomous QR ordering and faster turnover directly boost your bottom line.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl backdrop-blur-xl">
            {/* Input Sliders */}
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-600">Daily Table Orders Served</span>
                  <span className="text-amber-400 font-mono text-sm">{dailyTables} tables/day</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={dailyTables}
                  onChange={(e) => setDailyTables(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-600">Average Bill Amount (Ticket Size)</span>
                  <span className="text-amber-400 font-mono text-sm">₹{avgTicket}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="20"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200 text-[11px] text-stone-500 leading-relaxed">
                💡 <em>Based on hospitality benchmark studies, digital QR menus increase average ticket size by 12% and accelerate table turns by 6 minutes.</em>
              </div>
            </div>

            {/* Output Projection */}
            <div className="bg-stone-950 border border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between text-center space-y-4 shadow-inner">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                  Estimated Monthly Revenue Lift
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                  +₹{monthlyRevenueLift.toLocaleString("en-IN")}
                </div>
                <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
                  (+₹{annualGains.toLocaleString("en-IN")} / year in added profit)
                </span>
              </div>

              <div className="border-t border-stone-200 pt-3 flex justify-between text-xs text-stone-600">
                <span>QR Café SaaS Plan:</span>
                <span className="font-mono text-stone-900 font-bold">₹799 / mo</span>
              </div>

              <Link
                href="/onboarding"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-95"
              >
                Claim 7-Day Free Trial &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS WALL */}
        <section className="w-full space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Trusted by 100+ Café Founders
            </span>
            <h2 className="text-3xl font-black text-stone-900">Loved by High-Volume Kitchens</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-lg backdrop-blur-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="text-amber-400 text-sm tracking-widest">{t.rating}</span>
                  <p className="text-xs text-stone-600 leading-relaxed italic">&quot;{t.quote}&quot;</p>
                </div>
                <div className="border-t border-stone-200 pt-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-sm">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{t.author}</h4>
                    <p className="text-[10px] text-stone-500">{t.role} • {t.tables}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* UNIFIED PRICING PLAN */}
        <section id="pricing" className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Transparent Flat Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              One Simple All-in-One Plan
            </h2>
            <p className="text-xs text-stone-500">
              No hidden fees, no limits, no feature lockouts. <strong>7-day full-access free trial</strong> included.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Unlimited Access
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-stone-900">All-in-One Pro Plan</h3>
                <p className="text-xs text-stone-500 mt-0.5">Everything you need to operate a modern café or restaurant</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400 font-mono">₹799</span>
                <span className="text-xs text-stone-500">/ month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Unlimited Tables</strong> &amp; QR Tent Stands</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Unlimited Menu Dishes</strong> &amp; Modifiers</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Live Kitchen Display (KDS)</strong> with Voice Calls</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Point-of-Sale (POS) Fast Billing &amp; Receipts</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Automated GST Tax Invoicing &amp; Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Custom Logo, Theme Branding &amp; Google Reviews</span>
              </div>
            </div>

            <Link
              href="/onboarding"
              className="block text-center w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              Start Free 7-Day Trial &rarr;
            </Link>
          </div>
        </section>

        {/* INTERACTIVE FAQ ACCORDION */}
        <section id="faqs" className="w-full max-w-3xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-black text-stone-900">Got Questions? We&apos;ve Got Answers</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white/70 border border-stone-200 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex justify-between items-center gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-stone-900">{faq.q}</span>
                    <span className="text-amber-400 text-sm font-bold">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-stone-500 leading-relaxed border-t border-stone-200/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL LAUNCH CTA CARD */}
        <section className="w-full max-w-4xl bg-gradient-to-r from-amber-500/20 via-stone-900 to-amber-500/20 border border-amber-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-stone-900 leading-tight">
            Ready to Automate Your Café?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            Join forward-thinking café founders accelerating table turnover, cutting food waste, and delighting guests with contactless dine-in.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="inline-block px-10 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all active:scale-95"
            >
              🚀 Launch My Café in 60 Seconds &rarr;
            </Link>
          </div>
        </section>
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500 bg-white/90 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} QR Café Platform • Fully Automated Multi-Tenant Restaurant OS</p>
          <div className="flex items-center gap-6 text-stone-500">
            <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-stone-900 transition-colors">Staff Login</Link>
            <Link href="/onboarding" className="hover:text-stone-900 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
