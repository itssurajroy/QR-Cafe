// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, SparklesIcon } from "@/components/Icons";

type BillingClientProps = {
  restaurant: any;
};

export default function BillingClient({ restaurant }: BillingClientProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("payment") === "success" ||
        params.get("razorpay_payment_id") ||
        params.get("razorpay_payment_link_status") === "paid"
      ) {
        setPaymentSuccess(true);
      }
    }
  });

  const plan = restaurant?.plan || "trial";
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const subEnds = restaurant?.subscription_ends_at ? new Date(restaurant.subscription_ends_at) : null;

  const now = Date.now();
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now) / (1000 * 60 * 60 * 24))) : 0;
  const isPaidActive = plan === "active";
  const isTrialActive = plan === "trial" && daysLeft > 0;
  const isExpired = !isPaidActive && !isTrialActive;

  const monthlyPrice = 999;
  const yearlyPrice = 9999;
  const currentPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice;
  const periodLabel = billingCycle === "monthly" ? "/month" : "/year";

  async function handleSubscribe(simulate = false) {
    if (simulate) {
      setSimulating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle: billingCycle, simulate }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.short_url) {
          window.location.href = data.short_url;
        } else if (data.simulated) {
          window.location.reload();
        } else {
          window.location.reload();
        }
      } else {
        setError({
          message: data.error || "Failed to initiate Razorpay checkout.",
          hint: data.hint || "Please verify your Razorpay API credentials.",
        });
      }
    } catch {
      setError({
        message: "Network error connecting to payment gateway.",
        hint: "Please check your internet connection and try again.",
      });
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError({ message: data.error || "Failed to cancel subscription" });
      }
    } catch {
      setError({ message: "Network error while cancelling subscription." });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-[#007AFF] selection:text-white">
      {/* Apple-style Frosted Header */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Admin Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Subscription & Billing</h1>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-black/[0.04] px-3 py-1 rounded-full border border-black/[0.04]">
            {restaurant?.name || "Café"}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 w-full space-y-6 my-auto">
        {/* Billing Cycle Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-black/[0.04] rounded-2xl border border-black/[0.05]">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly (₹999/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Annual (₹9,999/yr)</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Payment Success Celebratory Banner */}
        {paymentSuccess && (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 shadow-sm flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-xs font-bold text-emerald-900">Payment Successful!</p>
              <p className="text-[11px] text-emerald-700">
                Your restaurant subscription is active. Thank you for powering your restaurant with QRslice!
              </p>
            </div>
          </div>
        )}

        {/* Bento Main Card */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
QRslice Complete
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isPaidActive
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : isTrialActive
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {isPaidActive ? "Active ✓" : isTrialActive ? `Free Trial (${daysLeft} Days Left)` : "Expired"}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-medium text-slate-500">{periodLabel}</span>
                {billingCycle === "yearly" && (
                  <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    Saves ₹1,989/year (~2 mos free)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {isPaidActive
                  ? `Next renewal: ${subEnds?.toLocaleDateString("en-IN") || "Auto-renews at end of cycle"}`
                  : isTrialActive
                  ? `Free trial active until ${trialEnds?.toLocaleDateString("en-IN")}`
                  : "Subscription expired. Re-activate to resume live customer ordering."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {!isPaidActive ? (
                <button
                  type="button"
                  onClick={() => handleSubscribe(false)}
                  disabled={loading || simulating}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-xs transition-all shadow-md shadow-[#007AFF]/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Connecting to Razorpay…</span>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>Subscribe Now (₹{currentPrice.toLocaleString("en-IN")}) →</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? "Cancelling…" : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>

          {/* Diagnostic Error Banner with Sandbox Fallback */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 text-red-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-red-900">Checkout Error:</span>
                <span className="flex-1">{error.message}</span>
              </div>
              {error.hint && (
                <p className="text-slate-600 bg-white/70 p-2.5 rounded-xl border border-red-100 leading-relaxed">
                  <strong>Fix:</strong> {error.hint}
                </p>
              )}
              {/* Sandbox Activation Fallback */}
              <div className="pt-2 border-t border-red-200/60 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-500">
                  Testing locally or awaiting key activation?
                </span>
                <button
                  type="button"
                  onClick={() => handleSubscribe(true)}
                  disabled={simulating || loading}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[11px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {simulating ? "Activating Sandbox…" : "⚡ Activate Test / Sandbox Mode"}
                </button>
              </div>
            </div>
          )}

          {/* Included Features Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Everything Included in QRslice Complete
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>QR Digital Menu</strong> & Table Ordering</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Multi-Station KDS</strong> & Prep Workflow</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>POS Register</strong> & Bluetooth Thermal Printing</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Live Order Dashboard</strong> with Sound Chimes</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>GST Invoicing</strong> & Financial Analytics</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Unlimited Tables, Dishes</strong> & Staff Seats</span>
              </div>
            </div>
          </div>

          {/* Secure Trust Footer */}
          <div className="bg-slate-50/80 border border-black/[0.04] rounded-2xl p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secured by Razorpay Subscriptions · 256-bit SSL Encryption</span>
            </div>
            <span className="font-medium text-slate-400">Cancel anytime · GST extra</span>
          </div>
        </div>
      </main>
    </div>
  );
}

