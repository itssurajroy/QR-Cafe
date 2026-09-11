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

  const pricePerMonth = 699;

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
    if (!confirm("Are you sure you want to cancel your subscription?")) {
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
    <div className="landing-page min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-900 text-xs font-bold transition-colors"
            >
              ← Admin Dashboard
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-sm font-black text-slate-900">Subscription & Billing</h1>
          </div>
          <span className="text-xs text-slate-400 font-mono">{restaurant?.name}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full space-y-6 my-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
                  QRslice Plan
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                    isPaidActive
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : isTrialActive
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {isPaidActive ? "Active ✓" : isTrialActive ? `Trial (${daysLeft} Days Left)` : "Expired"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">₹{pricePerMonth}/month</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPaidActive
                  ? `Next renewal: ${subEnds?.toLocaleDateString("en-IN") || "Auto-renews monthly"}`
                  : isTrialActive
                  ? `Free trial until ${trialEnds?.toLocaleDateString("en-IN")}`
                  : "Subscription expired. Renew to resume."}
              </p>
            </div>

            <div className="flex gap-2">
              {!isPaidActive ? (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Connecting…" : `Subscribe (₹${pricePerMonth}/mo) →`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  {cancelling ? "Cancelling…" : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Everything Included
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>QR Digital Menu</strong> & Table Ordering</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>KOT & Bill Printing</strong> (Bluetooth)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Live Order Dashboard</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Table Management</strong> & QR Stands</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>GST Tax Invoicing & Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Email Support</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 space-y-1">
            <p>Secure billing powered by Razorpay. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
