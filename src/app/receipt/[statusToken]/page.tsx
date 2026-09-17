// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";

function paise(n: number) {
  return `₹${(n / 100).toLocaleString("en-IN")}`;
}

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ statusToken: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Smart Review Funnel State
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Ref guard against duplicate event logging in StrictMode
  const viewedLoggedRef = useRef(false);

  useEffect(() => {
    params.then((p) => setToken(p.statusToken));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/order-status/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setError(json.error || "Order not found");
        }
      } catch {
        setError("Failed to load receipt");
      }
    }
    fetchReceipt();
  }, [token]);

  // Log receipt_viewed telemetry once per session
  useEffect(() => {
    if (!data || viewedLoggedRef.current) return;
    viewedLoggedRef.current = true;

    fetch("/api/whatsapp/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_token: token,
        event_type: "receipt_viewed",
        meta: {
          order_number: data.order_number,
          table: data.table,
        },
      }),
    }).catch(() => {});
  }, [data, token]);

  const handleStarClick = (stars: number) => {
    setRating(stars);
    fetch("/api/whatsapp/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_token: token,
        event_type: "review_clicked",
        meta: {
          stars,
          action: stars >= 4 ? "rating_high" : "rating_low",
        },
      }),
    }).catch(() => {});
  };

  const handleGoogleReviewClick = () => {
    fetch("/api/whatsapp/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_token: token,
        event_type: "review_clicked",
        meta: {
          stars: rating,
          action: "google_review_opened",
        },
      }),
    }).catch(() => {});
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    setIsSubmittingFeedback(true);

    try {
      await fetch("/api/whatsapp/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_token: token,
          event_type: "feedback_submitted",
          meta: {
            stars: rating,
            comment: feedbackComment.trim(),
          },
        }),
      });
      setFeedbackSent(true);
    } catch {
      // ignore
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-3">
          <span className="text-4xl">🧾</span>
          <h2 className="text-xl font-black text-slate-900">Receipt Not Found</h2>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const isUnpaid = data.payment_status === "unpaid";
  const dateStr = new Date(data.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = new Date(data.created_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const googleReviewLink =
    data.google_review_url ||
    `https://www.google.com/search?q=${encodeURIComponent(data.restaurant_name + " reviews")}`;

  return (
    <main className="min-h-screen bg-[#F4F4F6] text-slate-900 flex flex-col items-center py-8 px-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden">
        {/* ─── SMART REVIEW FUNNEL HERO SECTION ─── */}
        <div className="p-6 bg-gradient-to-b from-indigo-50/70 via-white to-white border-b border-dashed border-slate-200 text-center space-y-4">
          <div className="space-y-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {data.restaurant_name}
            </span>
            <p className="text-xs text-slate-500 font-medium">Digital Order Receipt</p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-700">
              How was your experience with us?
            </div>

            {/* 5-Star Rating Selector */}
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className={`text-3xl transition-transform hover:scale-125 cursor-pointer active:scale-95 ${
                    rating && rating >= star ? "text-amber-400 drop-shadow-xs" : "text-slate-300"
                  }`}
                  aria-label={`Rate ${star} star`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* HIGH RATING (4-5 Stars): Google Review CTA */}
            {rating && rating >= 4 && (
              <div className="pt-1 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-xs font-semibold text-emerald-700">
                  🎉 We&apos;re thrilled you enjoyed it! Mind sharing your experience on Google?
                </p>
                <a
                  href={googleReviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGoogleReviewClick}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs shadow-sm transition-all"
                >
                  <span>⭐ Write a Google Review</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            {/* LOW/MEDIUM RATING (1-3 Stars): Constructive Private Feedback */}
            {rating && rating < 4 && (
              <div className="pt-1 text-left space-y-2 animate-in fade-in zoom-in-95 duration-200">
                {!feedbackSent ? (
                  <form onSubmit={handleSubmitFeedback} className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      We want to make it right. Tell us how we can improve for next time:
                    </p>
                    <textarea
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts directly with the café manager..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingFeedback || !feedbackComment.trim()}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      {isSubmittingFeedback ? "Sending..." : "Send Private Feedback"}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold text-center">
                    ✓ Thank you! Your feedback has been sent directly to management.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── RECEIPT METADATA ─── */}
        <div className="p-6 border-b border-dashed border-slate-200 space-y-2 text-xs font-mono text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Order No:</span>
            <span className="font-bold font-mono text-slate-900">#{data.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Table / Section:</span>
            <span className="font-bold font-sans text-slate-900">{data.table || "Dine-in"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Date & Time:</span>
            <span className="font-mono text-slate-700">{dateStr} • {timeStr}</span>
          </div>
          {data.restaurant_gstin && (
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">GSTIN:</span>
              <span className="font-mono text-slate-700">{data.restaurant_gstin}</span>
            </div>
          )}
        </div>

        {/* ─── ITEMIZED ITEMS ─── */}
        <div className="p-6 border-b border-dashed border-slate-200 space-y-3">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
            <span>Item Description</span>
            <span>Amount</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.items?.map((it: any) => (
              <div key={it.id} className="py-2 flex justify-between items-start text-xs font-sans">
                <div className="pr-3">
                  <span className="font-bold text-slate-900">{it.quantity}x</span>{" "}
                  <span className="text-slate-800">{it.item_name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                  {paise(it.line_total_paise)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── TOTAL & PAYMENT ─── */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 space-y-2.5">
          <div className="flex justify-between items-center text-base font-black">
            <span className="font-sans text-slate-900">Total Paid</span>
            <span className="font-mono text-lg text-[#007AFF]">{paise(data.total_paise)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Payment Status</span>
            <span
              className={`font-bold uppercase px-2 py-0.5 rounded-lg text-[10px] ${
                isUnpaid ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isUnpaid ? "Unpaid" : "Paid"}
            </span>
          </div>
        </div>

        {/* ─── UPI QR (if unpaid) ─── */}
        {isUnpaid && data.upi_qr_url && (
          <div className="p-6 border-b border-dashed border-slate-200 text-center space-y-3 bg-amber-50/40">
            <h3 className="text-xs font-bold uppercase text-slate-700">Scan to Pay via UPI</h3>
            <div className="flex justify-center">
              <Image
                src={data.upi_qr_url}
                alt="UPI QR Code"
                width={140}
                height={140}
                className="border border-slate-200 rounded-xl p-2 bg-white shadow-xs"
              />
            </div>
            {data.upi_id && (
              <p className="text-[11px] text-slate-500 font-mono">{data.upi_id}</p>
            )}
          </div>
        )}

        {/* ─── FOOTER ─── */}
        <div className="p-6 text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">
            Thank you for dining with us! Come back soon.
          </p>
        </div>
      </div>

      {/* Powered by tag */}
      <div className="mt-6 text-xs text-slate-400 font-medium flex items-center gap-1.5">
        <span>Powered by</span>
        <a
          href="https://qrslice.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:opacity-80 transition-opacity"
        >
          <QrSliceLogo size="sm" />
        </a>
      </div>
    </main>
  );
}
