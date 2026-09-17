// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import { QRCodeDisplay } from "@/components/brand/QRCodeDisplay";
import {
  CheckCircleIcon,
  CoffeeIcon,
  SparklesIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from "@/components/Icons";

export default function OnboardingPage() {
  const router = useRouter();

  // 7-step guided flow state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Step 1: Restaurant information
  const [restaurantName, setRestaurantName] = useState("Table & Grain Cafe");
  const [slug, setSlug] = useState("table-and-grain");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("Shop 4, Indiranagar, Bengaluru");
  const [currency, setCurrency] = useState("INR");

  // Step 2: First category
  const [categoryName, setCategoryName] = useState("Beverages & Coffee");

  // Step 3: First menu item
  const [itemName, setItemName] = useState("Masala Chai Latte");
  const [itemPrice, setItemPrice] = useState("140");
  const [itemDesc, setItemDesc] = useState("Aromatic hand-brewed spiced tea with full cream milk.");
  const [itemVeg, setItemVeg] = useState(true);

  // Step 4: Create tables
  const [tableCount, setTableCount] = useState(6);

  // Step 6: Test simulated order state
  const [testOrderPlaced, setTestOrderPlaced] = useState(false);

  // Step 7: Ready to Launch / Owner Auth
  const [ownerName, setOwnerName] = useState("Suraj Roy");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = (name: string) => {
    setRestaurantName(name);
    const cleaned = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
    setSlug(cleaned);
  };

  const handleFinalProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeName: restaurantName.trim(),
          slug: slug.trim(),
          currency,
          phone: phone.trim(),
          address: address.trim(),
          tableCount,
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim(),
          ownerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to provision restaurant. Please check details.");
        setLoading(false);
        return;
      }

      // Auto login
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ownerEmail.trim(),
          password: ownerPassword,
        }),
      });

      router.push("/admin");
    } catch {
      setError("Network error occurred during onboarding.");
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: "Restaurant Info" },
    { num: 2, title: "Category" },
    { num: 3, title: "First Item" },
    { num: 4, title: "Tables" },
    { num: 5, title: "QR Codes" },
    { num: 6, title: "Test Order" },
    { num: 7, title: "Launch" },
  ];

  const progressPercent = Math.round((currentStep / 7) * 100);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center group">
            <QrSliceLogo size="md" className="group-hover:scale-105 transition-transform duration-200" priority />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Step {currentStep} of 7</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="font-bold text-[#5738F5]">{progressPercent}% Completed</span>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-violet-50 hover:text-[#5738F5] px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5738F5] to-[#7C3AED] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Stepper Navigation Pills Bar */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 overflow-x-auto no-scrollbar shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          {stepsList.map((st, idx) => {
            const isDone = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <React.Fragment key={st.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (isDone) setCurrentStep(st.num as any);
                  }}
                  disabled={!isDone && !isCurrent}
                  className={`flex items-center gap-2 shrink-0 transition-all ${
                    isDone ? "cursor-pointer hover:opacity-80" : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white shadow-xs"
                        : isCurrent
                        ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white shadow-md shadow-violet-500/25 scale-105"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? "✓" : st.num}
                  </div>
                  <span
                    className={`text-xs font-extrabold hidden md:inline ${
                      isCurrent
                        ? "text-[#5738F5]"
                        : isDone
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {st.title}
                  </span>
                </button>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 min-w-4 transition-colors ${
                      currentStep > st.num ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Card Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <div className="bg-white border border-slate-200/90 rounded-[2rem] p-6 sm:p-10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.06)] space-y-6">
          {/* STEP 1: RESTAURANT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                  STEP 1 OF 7 • RESTAURANT DETAILS
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Tell us about your restaurant
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  We&apos;ll configure your personalized QR table menus and cloud management console.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Restaurant or Café Name
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => autoSlug(e.target.value)}
                    placeholder="e.g. Wah Ji Wah, Table & Grain"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Subdomain / Web Slug
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3.5 focus-within:bg-white focus-within:border-[#5738F5] focus-within:ring-4 focus-within:ring-[#5738F5]/10 transition-all">
                    <span className="text-xs text-slate-400 font-mono select-none">qrslice.com/c/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      className="w-full bg-transparent py-3 px-1 text-xs sm:text-sm font-mono text-[#5738F5] font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all font-mono shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Base Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] transition-all shadow-xs cursor-pointer font-bold"
                    >
                      <option value="INR">INR (₹) — Indian Rupee</option>
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="GBP">GBP (£) — British Pound</option>
                      <option value="AED">AED (د.إ) — UAE Dirham</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Address / Outlet Location
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop 4, Burari / Indiranagar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer mt-2 active:scale-[0.99]"
              >
                Next: Create First Category →
              </button>
            </div>
          )}

          {/* STEP 2: CREATE FIRST MENU CATEGORY */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                  STEP 2 OF 7 • MENU CATEGORIES
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Create your first menu category
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Categories organize dishes for your guests (e.g. Starters, Hot Brews, Biryani).
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Beverages & Coffee"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-xs text-slate-500 font-bold block">
                    Quick suggestions (tap to apply):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Hot Brews & Espresso",
                      "Chef's Specials",
                      "Starters & Appetizers",
                      "Artisan Pizzas",
                      "Biryani & Rice",
                      "Desserts",
                    ].map((sugg) => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => setCategoryName(sugg)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          categoryName === sugg
                            ? "bg-violet-50 border-[#5738F5] text-[#5738F5] font-black"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        + {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer active:scale-[0.99]"
                >
                  Next: Add First Item →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CREATE FIRST MENU ITEM */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                  STEP 3 OF 7 • CULINARY DISH
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Add your first signature dish
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Add your bestselling dish to kickstart your contactless digital menu.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Dish / Drink Title
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Masala Chai Latte, Paneer Tikka"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Price ({currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-8 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Dietary Classification
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setItemVeg(true)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          itemVeg
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Vegetarian</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemVeg(false)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          !itemVeg
                            ? "bg-rose-50 border-rose-500 text-rose-800 font-black shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Short description highlighting flavors and preparation..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all resize-none shadow-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer active:scale-[0.99]"
                >
                  Next: Configure Tables →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CREATE TABLES */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                  STEP 4 OF 7 • SEATING SETUP
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Set up your restaurant tables
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  How many dining tables or counters do you want to generate QR codes for?
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">Total Dining Tables</div>
                    <div className="text-xs text-slate-500">Generates Table 01 to Table {String(tableCount).padStart(2, "0")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-black text-sm text-slate-800 hover:bg-slate-100 cursor-pointer shadow-xs active:scale-95"
                    >
                      −
                    </button>
                    <span className="font-mono font-black text-xl text-[#5738F5] w-8 text-center">
                      {tableCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTableCount(Math.min(50, tableCount + 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-black text-sm text-slate-800 hover:bg-slate-100 cursor-pointer shadow-xs active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Quick set:</span>
                  {[4, 8, 12, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTableCount(n)}
                      className={`text-xs px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                        tableCount === n
                          ? "bg-violet-50 border-[#5738F5] text-[#5738F5]"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {n} Tables
                    </button>
                  ))}
                </div>

                {/* Visual table tokens preview */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                  {Array.from({ length: Math.min(tableCount, 12) }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-violet-50/60 border border-violet-200 text-center font-mono font-black text-xs text-[#5738F5]"
                    >
                      T{String(i + 1).padStart(2, "0")}
                    </div>
                  ))}
                  {tableCount > 12 && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center font-bold text-xs text-slate-400">
                      +{tableCount - 12} more
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer active:scale-[0.99]"
                >
                  Next: Generate QR Codes →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: GENERATE QR CODES */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                  STEP 5 OF 7 • STAND-ALONE QR CODES
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Your Table QR standees are ready
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Each dining table gets a unique QR standee with zero app download required.
                </p>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-3xl flex flex-col items-center justify-center space-y-4 shadow-inner">
                <QRCodeDisplay
                  url={`https://qrslice.com/c/${slug}?table=01`}
                  restaurantName={restaurantName}
                  tableLabel="01"
                  seats={4}
                  showSignage={false}
                />
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                    High-Res Vector SVG & PDF Printable
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer active:scale-[0.99]"
                >
                  Next: Test Customer Ordering →
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: TEST CUSTOMER ORDERING SIMULATION */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                  STEP 6 OF 7 • LIVE SIMULATION
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Test the guest ordering experience
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Preview what your customers see when they scan Table 01 from their phone.
                </p>
              </div>

              <div className="border border-slate-200 rounded-3xl p-5 bg-[#FAF9F6] space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#5738F5] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      <CoffeeIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900">{restaurantName}</div>
                      <div className="text-[11px] font-mono text-[#5738F5] font-bold">TABLE 01 • DINE-IN</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Interactive Preview
                  </span>
                </div>

                {/* Mock Item Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex justify-between items-center shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${itemVeg ? "bg-emerald-600" : "bg-rose-600"}`} />
                      <span className="font-black text-sm text-slate-900">{itemName}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{itemDesc}</p>
                    <div className="font-mono font-black text-[#5738F5] text-sm pt-1">
                      ₹{itemPrice}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestOrderPlaced(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      testOrderPlaced
                        ? "bg-emerald-600 text-white font-black shadow-xs"
                        : "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white shadow-xs"
                    }`}
                  >
                    {testOrderPlaced ? "Added ✓" : "+ Add"}
                  </button>
                </div>

                {testOrderPlaced && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span>🎉</span>
                      <span>Simulated Order Placed for Table 01! Kitchen ticket printed.</span>
                    </div>
                    <span className="font-mono font-black text-[#5738F5]">#H-1001</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer active:scale-[0.99]"
                >
                  Next: Ready to Launch →
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: READY TO LAUNCH / OWNER CREDENTIALS */}
          {currentStep === 7 && (
            <form onSubmit={handleFinalProvision} className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  STEP 7 OF 7 • FINAL LAUNCH
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2.5">
                  Create your Owner Terminal Account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  You&apos;ll use these credentials to log in to your owner dashboard, POS, and live kitchen display.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Suraj Roy"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Owner Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@tableandgrain.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-violet-500/25 cursor-pointer disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-300" />
                  <span>{loading ? "Provisioning Restaurant…" : "Launch My Restaurant Now →"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="px-6 py-4 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 QRslice Inc. Cloud Terminal Provisioning</span>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/login" className="hover:text-[#5738F5] font-bold">
              Existing Restaurant? Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
