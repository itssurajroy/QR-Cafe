"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CoffeeIcon, SparklesIcon, CheckCircleIcon, QrCodeIcon, UtensilsIcon } from "@/components/Icons";

const PRESET_OPTIONS = [
  {
    id: "coffee",
    title: "Specialty Café & Espresso Bar",
    icon: "☕",
    desc: "Espresso, cold brew, pour-overs, croissants & toasts",
  },
  {
    id: "bistro",
    title: "Artisanal Bistro & Diner",
    icon: "🍽️",
    desc: "Pastas, sourdough sandwiches, gourmet salads & mains",
  },
  {
    id: "fastfood",
    title: "Fast Gourmet & Burger Hub",
    icon: "🍔",
    desc: "Smash burgers, loaded fries, shakes & finger food",
  },
  {
    id: "custom",
    title: "Blank Canvas (Custom Menu)",
    icon: "✨",
    desc: "Clean setup with 1 starter item ready for your dishes",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Café Identity & Business Details
  const [cafeName, setCafeName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [tagline, setTagline] = useState("");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [taxRate, setTaxRate] = useState<number>(5);
  const [accentColor, setAccentColor] = useState("#f59e0b");

  // Step 2: Seating & Starter Menu
  const [tableCount, setTableCount] = useState(6);
  const [preset, setPreset] = useState<"coffee" | "bistro" | "fastfood" | "custom">("coffee");

  // Step 3: Owner Auth & Launch
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function autoSlug(name: string) {
    setCafeName(name);
    const cleaned = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
    setSlug(cleaned);
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeName: cafeName.trim(),
          slug: slug.trim(),
          currency,
          timezone,
          tagline: tagline.trim() || undefined,
          gstin: gstin.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          googleReviewUrl: googleReviewUrl.trim() || undefined,
          taxRate,
          accentColor,
          tableCount,
          preset,
          ownerEmail: ownerEmail.trim(),
          ownerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to provision café. Please verify your details.");
        setLoading(false);
        return;
      }

      // Auto-login manager
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ownerEmail.trim(),
          password: ownerPassword,
        }),
      });

      if (loginRes.ok) {
        router.push("/admin");
      } else {
        router.push("/login?onboarded=true");
      }
    } catch {
      setError("Network error occurred. Please retry.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-lg shadow-md shadow-amber-500/20">
              <CoffeeIcon className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">QR Café Platform</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl bg-amber-500/10"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto p-4 sm:p-6 w-full my-auto space-y-6">
        {/* Step Progress Pills */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-500"
              }`}
            >
              1
            </span>
            <span className={`text-xs font-bold ${step >= 1 ? "text-white" : "text-stone-500"}`}>
              Café Setup
            </span>
          </div>
          <div className="w-8 h-0.5 bg-stone-800"></div>
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-500"
              }`}
            >
              2
            </span>
            <span className={`text-xs font-bold ${step >= 2 ? "text-white" : "text-stone-500"}`}>
              Tables & Menu
            </span>
          </div>
          <div className="w-8 h-0.5 bg-stone-800"></div>
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-500"
              }`}
            >
              3
            </span>
            <span className={`text-xs font-bold ${step >= 3 ? "text-white" : "text-stone-500"}`}>
              Account & Launch
            </span>
          </div>
        </div>

        {/* Wizard Container */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleOnboard}>
            {/* Step 1: Café Identity */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Create Your Café Space</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Set up your business name and custom ordering domain.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blue Lagoon Specialty Coffee"
                    value={cafeName}
                    onChange={(e) => autoSlug(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                    Store Link (URL)
                  </label>
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs">
                    <span className="text-stone-500 font-mono">yourdomain.com/c/</span>
                    <input
                      type="text"
                      required
                      placeholder="blue-lagoon"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="bg-transparent text-amber-400 font-mono font-bold flex-1 focus:outline-none ml-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                    Tagline (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handcrafted brews & artisanal bites"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                      Google Business Review Link (optional)
                    </label>
                    <span className="text-xs text-amber-400 font-medium">Auto-prompts 5-star guests</span>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g. https://g.page/r/your-cafe/review or https://search.google.com/..."
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Customers who rate 4★ or 5★ on their live order tracker will be prompted to leave a review directly on your Google page.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!cafeName || !slug}
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer mt-4"
                >
                  Continue to Tables & Menu &rarr;
                </button>
              </div>
            )}

            {/* Step 2: Seating & Starter Menu Preset */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Tables & Starter Menu</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Choose your seating setup and starter menu template to launch fast.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                    Number of Tables to Auto-Generate (with QR Stand Tokens)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={30}
                      value={tableCount}
                      onChange={(e) => setTableCount(Number(e.target.value))}
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-amber-400 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
                      {tableCount} Tables (T01 - T{tableCount < 10 ? "0" + tableCount : tableCount})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-2">
                    Select Starter Menu Preset
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRESET_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setPreset(opt.id as any)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          preset === opt.id
                            ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500"
                            : "bg-stone-950 border-stone-800/80 hover:border-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{opt.icon}</span>
                          <span className="font-bold text-xs text-white">{opt.title}</span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Continue to Account &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Owner Credentials & Launch */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Owner Account & Security</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Your café will be provisioned with a <strong>7-Day Free Trial</strong> (All-in-One Plan: Unlimited Tables, KDS & Billing).
                  </p>
                </div>

                {/* Plan Highlights Badge */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-white block">All-in-One Plan (7 Days Free)</span>
                    <span className="text-xs text-stone-400">Unlimited Tables, Real-time KDS, Full POS Billing</span>
                  </div>
                  <span className="text-amber-400 font-mono font-black text-xs">₹799/mo after trial</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="manager@yourcafe.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !ownerEmail || !ownerPassword}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Creating your account…" : "Launch My Store 🚀"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800/60 py-4 text-center text-xs text-stone-500">
        QR Café • Next-Gen Point of Sale & Dine-In Ordering
      </footer>
    </main>
  );
}
