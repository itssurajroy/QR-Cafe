// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
  CheckCircleIcon,
  CoffeeIcon,
  ClockIcon,
} from "@/components/Icons";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [cafeCode, setCafeCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify credentials.");
        setLoading(false);
        return;
      }

      window.location.href = data.destination || "/admin";
    } catch {
      setError("Network error occurred during login. Please retry.");
      setLoading(false);
    }
  }

  function pressDigit(d: string) {
    setError(null);
    setPin((prev) => (prev.length >= 4 ? prev : prev + d));
  }

  function pressBackspace() {
    setPin((prev) => prev.slice(0, -1));
  }

  async function pinLogin(pinValue?: string) {
    const code = pinValue ?? pin;
    if (!cafeCode.trim() || code.length !== 4) {
      setError("Enter your café code and 4-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_slug: cafeCode.trim(), pin: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid café code or PIN.");
        setPin("");
        setLoading(false);
        return;
      }
      window.location.href = data.destination || "/pos";
    } catch {
      setError("Network error occurred during sign-in. Please retry.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-[family-name:var(--font-plus-jakarta)] flex flex-col justify-between selection:bg-[#5738F5] selection:text-white antialiased">
      {/* Top Simple Header */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center group">
            <QrSliceLogo size="md" className="group-hover:scale-105 transition-transform duration-200" priority />
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">
              Don&apos;t have an account?
            </span>
            <Link
              href="/onboarding"
              className="px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-[#5738F5] font-black text-xs border border-violet-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          {/* Left Column: Hospitality Visual Showcase (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between bg-white border border-slate-200/90 rounded-[2.5rem] p-8 sm:p-10 shadow-sm relative overflow-hidden">
            {/* Ambient subtle decorative light pill */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-violet-50 text-[#5738F5] border border-violet-200">
                  <span className="w-2 h-2 rounded-full bg-[#5738F5] animate-pulse" />
                  Platform Live
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  Real-time Sync
                </span>
              </div>

              <div>
                <h1 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Where dining meets effortless technology.
                </h1>
                <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
                  Real-time contactless table ordering, instant kitchen display sync, and automated receipts built for modern Indian restaurants.
                </p>
              </div>

              {/* Interactive Mockup Preview Card */}
              <div className="bg-[#FAF9F6] border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#5738F5] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      <CoffeeIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Table T01 • Dine-In</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Order #H-8754</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <ClockIcon className="w-3 h-3 text-amber-600" />
                    Prep: 14m
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">1× Butter Chicken (Medium Spice)</span>
                    <span className="font-mono font-bold text-slate-900">₹340</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">1× Paneer Tikka (Tandoori)</span>
                    <span className="font-mono font-bold text-slate-900">₹240</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Bill</span>
                  <span className="font-mono font-black text-base text-[#5738F5]">₹580.00</span>
                </div>
              </div>
            </div>

            {/* Bottom Testimonial / Stat Strip */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-violet-100 border border-white flex items-center justify-center text-[10px] font-black text-[#5738F5]">
                    W
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border border-white flex items-center justify-center text-[10px] font-black text-emerald-700">
                    C
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-100 border border-white flex items-center justify-center text-[10px] font-black text-amber-700">
                    T
                  </div>
                </div>
                <span className="font-bold text-slate-700">500+ Active Cafés</span>
              </div>
              <span className="font-bold text-emerald-700">⭐ 4.9 Hospitality Rating</span>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="col-span-1 lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white border border-slate-200/90 rounded-[2rem] p-6 sm:p-9 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.06)] space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5738F5] block mb-1">
                  Secure Sign In
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Sign in to access your restaurant dashboard, POS, or live kitchen display.
                </p>
              </div>

              {/* Sign-in mode toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setMode("password"); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    mode === "password" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("pin"); setError(null); setPin(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    mode === "pin" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Staff PIN
                </button>
              </div>

              {mode === "password" ? (
              <form onSubmit={login} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="username"
                      placeholder="e.g. owner@tableandgrain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Case sensitive
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-[#5738F5] focus:ring-[#5738F5] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="mailto:support@qrslice.com?subject=Password%20Reset%20Request"
                    className="font-bold text-[#5738F5] hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all disabled:opacity-50 shadow-lg shadow-violet-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <LockIcon className="w-4 h-4 text-white" />
                  <span>{loading ? "Signing in…" : "Sign In →"}</span>
                </button>
              </form>
              ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); pinLogin(); }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="login-cafe-code"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Café Code
                  </label>
                  <input
                    id="login-cafe-code"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. table-and-grain"
                    value={cafeCode}
                    onChange={(e) => setCafeCode(e.target.value.toLowerCase().trim())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] focus:ring-4 focus:ring-[#5738F5]/10 transition-all shadow-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kitchen and waiter staff sign in with a quick 4-digit PIN.
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    4-Digit PIN
                  </span>
                  <div className="flex items-center justify-center gap-2 py-2" aria-label="Entered PIN">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black font-mono transition-all ${
                          pin[i]
                            ? "border-[#5738F5] bg-violet-50 text-slate-900"
                            : "border-slate-200 bg-slate-50 text-slate-300"
                        }`}
                      >
                        {pin[i] ? "•" : ""}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (pin.length < 4) {
                            const next = pin + d;
                            setPin(next);
                            setError(null);
                            if (next.length === 4) pinLogin(next);
                          }
                        }}
                        className="py-3 rounded-xl bg-slate-100 hover:bg-violet-100 hover:text-[#5738F5] text-slate-800 font-black text-base transition-colors cursor-pointer active:scale-95"
                      >
                        {d}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={pressBackspace}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm transition-colors cursor-pointer active:scale-95"
                      aria-label="Backspace"
                    >
                      ⌫
                    </button>
                    <button
                      type="button"
                      onClick={() => pressDigit("0")}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-violet-100 hover:text-[#5738F5] text-slate-800 font-black text-base transition-colors cursor-pointer active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setPin("")}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm transition-colors cursor-pointer active:scale-95"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || pin.length !== 4 || !cafeCode.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all disabled:opacity-50 shadow-lg shadow-violet-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <LockIcon className="w-4 h-4 text-white" />
                  <span>{loading ? "Signing in…" : "Sign In with PIN →"}</span>
                </button>
              </form>
              )}

              

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Want to set up your own restaurant? </span>
                <Link
                  href="/onboarding"
                  className="font-black text-[#5738F5] hover:underline"
                >
                  Start Onboarding →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Simple Bar */}
      <footer className="px-6 py-4 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 QRslice Inc. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/legal/privacy" className="hover:text-slate-800">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/legal/terms" className="hover:text-slate-800">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[#5738F5] font-bold">
              Return to Website
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
