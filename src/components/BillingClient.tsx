"use client";

import { useState } from "react";
import Link from "next/link";
import { CoffeeIcon, SparklesIcon, CheckCircleIcon } from "@/components/Icons";

type BillingClientProps = {
  restaurant: any;
};

export default function BillingClient({ restaurant }: BillingClientProps) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = restaurant?.plan || "trial";
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const subEnds = restaurant?.subscription_ends_at ? new Date(restaurant.subscription_ends_at) : null;

  const now = Date.now();
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now) / (1000 * 60 * 60 * 24))) : 0;
  const isTrialActive = plan === "trial" && daysLeft > 0;
  const isPaidActive = plan === "active";
  const isSuspended = plan === "suspended" || (plan === "trial" && daysLeft === 0);

  const pricePerMonth = 799;

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.short_url) {
        window.location.href = data.short_url;
      } else {
        setError(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      setError("Network error connecting to payment gateway.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription? Dine-in ordering will pause after your billing period ends.")) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to cancel subscription");
      }
    } catch {
      setError("Network error");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Navigation Header */}
      <header className="border-b border-stone-800 bg-stone-900/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-stone-400 hover:text-white text-xs font-bold transition-colors"
            >
              &larr; Admin Dashboard
            </Link>
            <span className="text-stone-700">|</span>
            <h1 className="text-sm font-black text-white">Subscription & Billing Portal</h1>
          </div>
          <span className="text-xs text-stone-400 font-mono">{restaurant?.name}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full space-y-6 my-auto">
        {/* Status Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  All-in-One Unlimited Plan
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isPaidActive
                      ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                      : isTrialActive
                      ? "bg-amber-950 border-amber-700 text-amber-400"
                      : "bg-red-950 border-red-800 text-red-400"
                  }`}
                >
                  {isPaidActive ? "Active Subscription ✓" : isTrialActive ? `Free Trial (${daysLeft} Days Left)` : "Subscription Expired"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">₹{pricePerMonth}/month</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {isPaidActive
                  ? `Next renewal date: ${subEnds?.toLocaleDateString("en-IN") || "Auto-renews monthly"}`
                  : isTrialActive
                  ? `Free trial active until ${trialEnds?.toLocaleDateString("en-IN")}`
                  : "Dine-in ordering is paused. Renew now to resume customer orders."}
              </p>
            </div>

            <div className="flex gap-2">
              {!isPaidActive ? (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Connecting to Razorpay…" : `Subscribe (₹${pricePerMonth}/mo) →`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {cancelling ? "Cancelling…" : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* All Included Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Everything Included in Your Plan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Unlimited Tables</strong> & QR Tent Stands</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Unlimited Menu Items</strong> & Modifiers</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Live Kitchen Display (KDS)</strong> with Audio Chimes</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Point-of-Sale (POS) Fast Billing & 80mm Receipts</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Automated GST Tax Invoicing & Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Custom Logo, Theme Branding & Google Reviews Popup</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 text-[11px] text-stone-400 space-y-1">
            <p>🔒 <strong>Secure Automated Billing</strong> powered by Razorpay Subscriptions.</p>
            <p>You can cancel anytime. You will not be billed until your 7-day free trial period ends.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
