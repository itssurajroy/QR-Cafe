// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { CreditCardIcon } from "@/components/Icons";

declare global {
  interface Window {
    Razorpay?: new (options: any) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
      close: () => void;
    };
  }
}

type RazorpayPaymentButtonProps = {
  orderId: string;
  orderNumber: string;
  amountPaise: number;
  restaurantName?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
};

export default function RazorpayPaymentButton({
  orderId,
  orderNumber,
  amountPaise,
  restaurantName = "QRslice",
  onSuccess,
  onError,
  disabled = false,
}: RazorpayPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [rzpLoaded, setRzpLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRzpLoaded(true);
    }
  }, []);

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
  };

  async function handlePay() {
    if (disabled) return;
    if (!rzpLoaded) {
      setError("Payment gateway is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch(`/api/orders/${orderId}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        setError(orderData.error || "Failed to create payment order.");
        setLoading(false);
        if (onError) onError(orderData.error || "Failed to create payment order");
        return;
      }

      const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        setError("Payment gateway configuration incomplete (NEXT_PUBLIC_RAZORPAY_KEY_ID missing).");
        setLoading(false);
        if (onError) onError("Payment gateway configuration incomplete");
        return;
      }

      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        setError("Payment gateway failed to load. Please refresh and try again.");
        setLoading(false);
        if (onError) onError("Payment gateway failed to load");
        return;
      }

      const rzp = new RazorpayConstructor({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.order_id,
        name: restaurantName,
        description: `Order #${orderNumber}`,
        theme: {
          color: "#007AFF",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: any) => {
          setLoading(true);
          try {
            const verifyRes = await fetch(`/api/orders/${orderId}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              if (onSuccess) onSuccess();
            } else {
              setError(verifyData.error || "Payment verification failed.");
              if (onError) onError(verifyData.error || "Payment verification failed");
            }
          } catch {
            setError("Network error during payment verification.");
            if (onError) onError("Network error during payment verification");
          } finally {
            setLoading(false);
          }
        },
      });

      rzp.on("payment.failed", (response: any) => {
        setError(response.error?.description || "Payment failed. Please try again.");
        if (onError) onError(response.error?.description || "Payment failed");
        setLoading(false);
      });

      rzp.open();
    } catch {
      setError("Network error connecting to payment gateway.");
      if (onError) onError("Network error connecting to payment gateway");
    } finally {
      if (!loading) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRzpLoaded(true)}
      />
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || disabled}
        className="w-full px-6 py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-xs transition-all shadow-md shadow-[#007AFF]/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Opening Razorpay…</span>
          </>
        ) : (
          <>
            <CreditCardIcon className="w-4 h-4" />
            <span>Pay {formatAmount(amountPaise)} via Razorpay</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 text-center bg-red-50 px-3 py-2 rounded-xl border border-red-200">
          {error}
        </p>
      )}
      <p className="text-[10px] text-slate-400 text-center">
        Secured by Razorpay · 256-bit SSL Encryption
      </p>
    </div>
  );
}