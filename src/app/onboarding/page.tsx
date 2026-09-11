"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QrSliceLogo, QrSliceIcon } from "@/components/brand/QrSliceLogo";
import { QRCodeDisplay } from "@/components/brand/QRCodeDisplay";
import { paise } from "@/lib/utils";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  CoffeeIcon,
  ChairIcon,
  BookOpenIcon,
  QrCodeIcon,
  SparklesIcon,
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

  // Step 5: Generated QR state (auto generated for Table 01)
  // Step 6: Test simulated order state
  const [testOrderPlaced, setTestOrderPlaced] = useState(false);

  // Step 7: Ready to Launch / Owner Auth
  const [ownerName, setOwnerName] = useState("Suraj Roy");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
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

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#17142B] flex flex-col font-sans selection:bg-[#5738F5] selection:text-white antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E7E4F0] px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <QrSliceLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6F7185] hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="text-xs font-bold text-[#5738F5] bg-[#EEEAFE] px-3.5 py-1.5 rounded-xl hover:bg-purple-100 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Indicator 1..7 */}
      <div className="bg-white border-b border-[#E7E4F0] py-3.5 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          {stepsList.map((st, idx) => {
            const isDone = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/30 scale-105"
                        : "bg-slate-100 text-[#6F7185]"
                    }`}
                  >
                    {isDone ? "✓" : st.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden md:inline ${
                      isCurrent ? "text-[#17142B]" : "text-[#6F7185]"
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
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

      {/* Main Form Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          {/* STEP 1: RESTAURANT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2.5 py-1 rounded-md">
                  STEP 1 OF 7
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Tell us about your restaurant
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  We'll configure your customer QR menu and staff dashboard.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Restaurant or Café Name
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => autoSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Subdomain / Web Slug
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3">
                    <span className="text-xs text-[#6F7185] font-mono select-none">qrslice.app/c/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full bg-transparent py-3 px-1 text-sm font-mono text-[#17142B] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Address / Neighborhood
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 cursor-pointer mt-2"
              >
                Next: Create First Category →
              </button>
            </div>
          )}

          {/* STEP 2: CREATE FIRST MENU CATEGORY */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2.5 py-1 rounded-md">
                  STEP 2 OF 7
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Create your first menu category
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  Categories organize dishes for your guests (e.g. Starters, Coffee, Mains).
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-[#6F7185] font-semibold">Quick suggestions:</span>
                  {["Hot Brews & Espresso", "Chef's Specials", "Artisan Pizzas", "Desserts"].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setCategoryName(sugg)}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 hover:bg-[#EEEAFE] hover:text-[#5738F5] transition-colors"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-sm cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 cursor-pointer"
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
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2.5 py-1 rounded-md">
                  STEP 3 OF 7
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Add your first food or beverage item
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  Put your bestselling dish on your digital menu.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Dish / Drink Name
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                      Price ({currency})
                    </label>
                    <input
                      type="number"
                      required
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                      Dietary Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setItemVeg(true)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                          itemVeg
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold"
                            : "bg-slate-50 border-slate-200 text-[#6F7185]"
                        }`}
                      >
                        🌱 Vegetarian
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemVeg(false)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                          !itemVeg
                            ? "bg-amber-50 border-amber-500 text-amber-800 font-extrabold"
                            : "bg-slate-50 border-slate-200 text-[#6F7185]"
                        }`}
                      >
                        🍗 Non-Veg
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-sm cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 cursor-pointer"
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
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2.5 py-1 rounded-md">
                  STEP 4 OF 7
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Set up your restaurant tables
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  How many dining tables or counters do you want to generate QR codes for?
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-extrabold text-sm text-[#17142B]">Initial Table Count</div>
                    <div className="text-xs text-[#6F7185]">Generates Table 01 to Table {String(tableCount).padStart(2, "0")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-sm text-[#17142B] hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-lg text-[#5738F5] w-8 text-center">
                      {tableCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTableCount(Math.min(50, tableCount + 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-sm text-[#17142B] hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Array.from({ length: Math.min(tableCount, 12) }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#EEEAFE]/50 border border-[#5738F5]/20 text-center font-mono font-bold text-xs text-[#5738F5]"
                    >
                      T{String(i + 1).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-sm cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex-1 py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 cursor-pointer"
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
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2.5 py-1 rounded-md">
                  STEP 5 OF 7
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Your Table QR codes are ready!
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  Each table gets a high-resolution QR standee with zero-download ordering.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center">
                <QRCodeDisplay
                  url={`https://qrslice.app/c/${slug}?table=01`}
                  restaurantName={restaurantName}
                  tableLabel="01"
                  seats={4}
                  showSignage={false}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-sm cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="flex-1 py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 cursor-pointer"
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
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2.5 py-1 rounded-md">
                  STEP 6 OF 7
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Test customer ordering experience
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  Experience what your guests see right on their phone when scanning Table 01.
                </p>
              </div>

              <div className="border border-[#E7E4F0] rounded-3xl p-5 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#5738F5] text-white flex items-center justify-center font-black text-xs">
                      Q
                    </span>
                    <div>
                      <div className="font-extrabold text-xs text-[#17142B]">{restaurantName}</div>
                      <div className="text-[10px] font-mono text-[#5738F5]">TABLE 01 · DINE-IN</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Live Demo
                  </span>
                </div>

                {/* Mock Item Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                  <div>
                    <div className="font-extrabold text-sm text-[#17142B]">{itemName}</div>
                    <div className="text-xs text-[#6F7185] mt-0.5">{itemDesc}</div>
                    <div className="font-mono font-black text-[#17142B] text-sm mt-1">
                      ₹{itemPrice}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestOrderPlaced(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      testOrderPlaced
                        ? "bg-emerald-600 text-white font-black"
                        : "bg-[#5738F5] text-white shadow-xs"
                    }`}
                  >
                    {testOrderPlaced ? "Added ✓" : "+ Add"}
                  </button>
                </div>

                {testOrderPlaced && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-between">
                    <span>🎉 Simulated Order Placed for Table 01! Kitchen ticket created.</span>
                    <span className="font-mono font-black">#1001</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-sm cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="flex-1 py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 cursor-pointer"
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
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                  STEP 7 OF 7 · READY TO LAUNCH
                </span>
                <h2 className="text-2xl font-black text-[#17142B] tracking-tight mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  Create your Owner Account
                </h2>
                <p className="text-xs text-[#6F7185] mt-1">
                  You'll use these credentials to log in to your restaurant dashboard and KDS.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Owner Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@myrestaurant.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7185] mb-1.5">
                    Account Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-sm cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm transition-all shadow-lg shadow-[#5738F5]/30 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Provisioning Restaurant…" : "🚀 Launch My Restaurant Now →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
