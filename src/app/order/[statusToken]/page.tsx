"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, SparklesIcon, CoffeeIcon } from "@/components/Icons";

const STEPS = [
  { key: "pending", label: "Order Placed", desc: "Ticket sent to kitchen", icon: "📝" },
  { key: "confirmed", label: "Accepted", desc: "Chef reviewed & queued", icon: "👨‍🍳" },
  { key: "preparing", label: "Cooking / Brewing", desc: "Freshly preparing at line", icon: "🔥" },
  { key: "ready", label: "Ready to Serve", desc: "Plated & ready for pickup", icon: "🔔" },
  { key: "served", label: "Delivered", desc: "Served at your table", icon: "✨" },
] as const;

function paise(n: number) {
  return `₹${(n / 100).toLocaleString("en-IN")}`;
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ statusToken: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  // Time Elapsed Counter
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Countdown timer remaining
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Modal / Popup Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [dismissedModal, setDismissedModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [compliments, setCompliments] = useState<string[]>([]);
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  useEffect(() => {
    params.then((p) => setToken(p.statusToken));
  }, [params]);

  // Live Fast Polling with Graceful Retry
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    async function poll() {
      try {
        const res = await fetch(`/api/order-status/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) {
          setData(json);
          setError(null);
          // Trigger feedback popup when served
          if (json.status === "served" && !dismissedModal && !submittedFeedback) {
            setShowFeedbackModal(true);
          }
        } else {
          setRetryCount((prev) => {
            const next = prev + 1;
            if (next >= 4) {
              setError(json.error || "Order not found");
            }
            return next;
          });
        }
      } catch {
        /* retain state */
      }
    }
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [token, dismissedModal, submittedFeedback]);

  // Status change sound notification
  useEffect(() => {
    if (!data?.status || !prevStatus || data.status === prevStatus) {
      if (data?.status) setPrevStatus(data.status);
      return;
    }
    setPrevStatus(data.status);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch { /* blocked */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  // Countdown timer based on status
  useEffect(() => {
    if (!data?.status || !data?.created_at) return;
    const statusCountdowns: Record<string, number> = {
      pending: 20 * 60,
      confirmed: 18 * 60,
      preparing: 10 * 60,
      ready: 0,
      served: 0,
    };
    const base = statusCountdowns[data.status] ?? 0;
    if (base === 0) { setCountdownSeconds(null); return; }
    const startTime = new Date(data.created_at).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, base - elapsed);
    setCountdownSeconds(remaining);
    const iv = setInterval(() => setCountdownSeconds(prev => prev !== null && prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [data?.status, data?.created_at]);

  // Live Timer based on created_at
  useEffect(() => {
    if (!data?.created_at) return;
    const startTime = new Date(data.created_at).getTime();
    const updateTimer = () => {
      const sec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(sec);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.created_at]);

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_token: token,
          rating,
          feedback: feedbackText,
          compliments,
        }),
      });
      if (res.ok) {
        setSubmittedFeedback(true);
      }
    } catch {
      /* ignore */
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function toggleCompliment(tag: string) {
    setCompliments((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" + s : s}s`;
  };

  if (error) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-4">
          <p className="text-4xl">🔍</p>
          <h2 className="text-xl font-bold text-white">Order Not Found</h2>
          <p className="text-sm text-stone-400">{error}</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-block shadow-md shadow-amber-500/20"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-400 font-mono">Syncing live order status…</p>
        </div>
      </main>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === data.status);
  const isOrderServed = data.status === "served";
  const currentStep = STEPS[currentIdx] || STEPS[0];
  const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / STEPS.length) * 100));

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 flex flex-col items-center justify-center font-sans antialiased selection:bg-amber-500 selection:text-black">
      <div className="max-w-md w-full bg-stone-900/90 border border-stone-800/90 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600"></div>

        {/* Top Header with Table Badge & Payment Pill */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Live Kitchen Sync
              </span>
              <span className="text-xs text-stone-400 font-mono">
                ⏱ {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white font-mono tracking-tight">
              Order #{data.order_number}
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Table <span className="text-amber-400 font-bold font-mono">{data.table}</span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block border ${
                data.payment_status === "paid"
                  ? "bg-emerald-950/80 border-emerald-700 text-emerald-400"
                  : "bg-amber-950/80 border-amber-700 text-amber-400"
              }`}
            >
              {data.payment_status === "paid" ? "Paid in Cash ✓" : "Cash at Counter"}
            </span>
            <div className="text-xs font-mono text-stone-500">
              {new Date(data.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Customer Payment Required Alert Banner (When Food Served & Unpaid) */}
        {data.status === "served" && data.payment_status === "unpaid" && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white shadow-2xl space-y-2 text-center animate-pulse border-2 border-amber-300">
            <div className="w-10 h-10 rounded-2xl bg-white text-stone-950 flex items-center justify-center text-xl font-black mx-auto shadow-md">
              💳
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">
                Bill Payment Due: {paise(data.total_paise)}
              </h3>
              <p className="text-xs opacity-95">
                Your food has been served! Please settle your bill at the counter or scan the café UPI QR before leaving.
              </p>
            </div>
          </div>
        )}

        {/* Current State Highlight Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-950 to-stone-950 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 font-black animate-pulse">
              {currentStep.icon}
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Current Status
              </span>
              <h3 className="text-base font-black text-white">{currentStep.label}</h3>
              <p className="text-xs text-stone-400">{currentStep.desc}</p>
            </div>
          </div>
        </div>

        {/* 4-Step Animated Progress Stepper */}
        <div className="space-y-4">
          {/* Step circles with connecting line */}
          <div className="flex items-center justify-between relative">
            {/* Background connecting line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-stone-800 z-0"></div>
            {/* Active progress line */}
            <div
              className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 z-0 transition-all duration-700"
              style={{ width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 100)}%`, right: "auto" }}
            ></div>

            {STEPS.map((s, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={s.key} className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/30"
                      : isCurrent
                      ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 animate-glow-pulse scale-110"
                      : "bg-stone-900 border-2 border-stone-700 text-stone-600"
                  }`}>
                    {isCompleted ? "✓" : s.icon}
                  </div>
                  <span className={`text-xs font-bold text-center max-w-12 leading-tight ${
                    isCurrent ? "text-amber-400" : isCompleted ? "text-emerald-400" : "text-stone-600"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Countdown timer */}
          {countdownSeconds !== null && countdownSeconds > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-950/30 border border-amber-800/50">
              <span className="text-amber-400 text-sm">⏳</span>
              <span className="text-xs text-stone-400">Est. ready in</span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {Math.floor(countdownSeconds / 60)}:{String(countdownSeconds % 60).padStart(2, "0")}
              </span>
            </div>
          )}
          {data.status === "ready" && (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-700 text-center animate-scale-bounce">
              <p className="text-sm font-black text-emerald-400">🔔 Your order is ready! A waiter is on the way.</p>
            </div>
          )}
        </div>

        {/* WhatsApp Share + Loyalty Points (when served) */}
        {isOrderServed && (
          <div className="space-y-3">
            {/* Loyalty Points Earned */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-xs font-black text-white">Loyalty Points Earned!</p>
                  <p className="text-xs text-stone-400">Redeemable on your next visit</p>
                </div>
              </div>
              <span className="text-lg font-black text-amber-400 font-mono">+{Math.floor((data.total_paise || 0) / 10000)} pts</span>
            </div>

            {/* WhatsApp Share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🍽️ My Order Status\nOrder #${data.order_number} at Table ${data.table}\nStatus: Served ✅\nTotal: ₹${((data.total_paise||0)/100).toFixed(0)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-[#25d366] hover:bg-[#1aab52] text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Share Order Status on WhatsApp
            </a>
          </div>
        )}

        {/* Itemized Order Recap */}
        {data.items && data.items.length > 0 && (
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-stone-400">
              <span>Itemized Order</span>
              <span>{data.items.length} dishes</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {data.items.map((it: any) => (
                <div key={it.id} className="flex justify-between items-center text-xs">
                  <span className="text-stone-200 font-medium">
                    {it.item_name} <span className="text-amber-400 font-bold font-mono">×{it.quantity}</span>
                  </span>
                  <span className="text-stone-400 font-mono">{paise(it.line_total_paise)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-800 pt-2 flex justify-between items-center text-xs font-black">
              <span className="text-stone-300">Total</span>
              <span className="text-amber-400 font-mono text-sm">{paise(data.total_paise)}</span>
            </div>
          </div>
        )}

        {/* Re-Open Feedback CTA Banner when Order Complete */}
        {isOrderServed && (
          <div className="bg-gradient-to-r from-amber-500/15 via-stone-900 to-amber-500/15 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <span className="text-xs font-black text-white block">
                  {submittedFeedback ? "Feedback Submitted ✓" : "Enjoyed your meal?"}
                </span>
                <span className="text-xs text-stone-400">
                  {submittedFeedback ? "Thank you! Rate us on Google Reviews." : "Tap to rate and review your experience."}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              {submittedFeedback ? "Google Review" : "Rate ★"}
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="border-t border-stone-800 pt-4 space-y-3 text-center">
          {data.qr_token && (
            <Link
              href={`/t/${data.qr_token}`}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs inline-block shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              + Add More Dishes to Table {data.table} &rarr;
            </Link>
          )}

          <p className="text-xs text-stone-400">
            Live kitchen status updates automatically as your order is prepared.
          </p>
        </div>
      </div>

      {/* POPUP MODAL FEEDBACK DIALOG WITH GOOGLE REVIEWS */}
      {showFeedbackModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => {
            setShowFeedbackModal(false);
            setDismissedModal(true);
          }}
        >
          <div
            className="w-full max-w-sm bg-stone-900 border-2 border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl relative text-center animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Cross */}
            <button
              type="button"
              onClick={() => {
                setShowFeedbackModal(false);
                setDismissedModal(true);
              }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            {!submittedFeedback ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">How was your meal?</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Order #{data.order_number} is completed!</p>
                </div>

                {/* 5-Star Rating Buttons */}
                <div className="flex justify-center items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform active:scale-125 cursor-pointer ${
                        star <= rating ? "text-amber-400 scale-110" : "text-stone-700 hover:text-stone-500"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Compliment Badges */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[
                    "⚡ Fast Service",
                    "☕ Great Taste",
                    "🔥 Hot & Fresh",
                    "🌟 Polite Staff",
                    "✨ Clean Table",
                  ].map((tag) => {
                    const isSelected = compliments.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleCompliment(tag)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 text-stone-950 border-amber-400 font-extrabold shadow-sm scale-105"
                            : "bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  placeholder="Suggestions or compliments for the chef? (optional)"
                  value={feedbackText}
                  maxLength={300}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 min-h-[65px] resize-none"
                />

                {/* Direct Google Reviews Callout if 4 or 5 stars */}
                {rating >= 4 && (
                  <div className="bg-stone-950/80 border border-amber-500/30 rounded-2xl p-3 text-center space-y-1.5">
                    <p className="text-xs text-amber-300 font-bold">
                      Loved our food & service?
                    </p>
                    <a
                      href={data.google_review_url || `https://www.google.com/search?q=${encodeURIComponent((data.restaurant_name || "Cafe") + " reviews")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white text-stone-900 font-black text-xs hover:bg-stone-100 transition-all shadow-md cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Rate Us on Google ★★★★★</span>
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setDismissedModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer border border-stone-700"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingFeedback ? "Submitting…" : "Submit Review →"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 space-y-4">
                <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <div>
                  <h3 className="text-lg font-black text-white">Thank You for Dining With Us!</h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Your review has been shared with the kitchen team.
                  </p>
                </div>

                {/* Google Reviews CTA Banner after submitting */}
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-amber-300">
                    Help other food lovers find {data.restaurant_name || "us"}!
                  </p>
                  <a
                    href={data.google_review_url || `https://www.google.com/search?q=${encodeURIComponent((data.restaurant_name || "Cafe") + " reviews")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-stone-950 font-black text-xs hover:bg-stone-100 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Leave Google Review ★★★★★</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-xs text-stone-500 hover:text-stone-300 font-bold pt-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
