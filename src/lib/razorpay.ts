// Copyright (c) 2026 QRslice. All rights reserved.
import crypto from "crypto";

async function rp(method: string, path: string, body?: any) {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    throw new Error("Razorpay keys are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }

  const auth = Buffer.from(`${key.trim()}:${secret.trim()}`).toString("base64");

  try {
    const r = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      let errorMsg =
        data.error?.description ||
        data.error?.message ||
        data.error;

      if (r.status === 401) {
        errorMsg =
          "Razorpay Authentication Failed (401 Unauthorized): The Key ID or Key Secret is invalid or expired. Please verify your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your Razorpay Dashboard (Settings > API Keys).";
      } else if (!errorMsg) {
        errorMsg = `Razorpay API error (${r.status})`;
      }

      return {
        error: errorMsg,
        status: r.status,
        details: data,
      };
    }
    return data;
  } catch (err: any) {
    return { error: err.message || "Network error connecting to Razorpay" };
  }
}

export const razorpay = {
  createCustomer: (email: string, name: string) =>
    rp("POST", "/customers", { email, name }),

  createPlan: (
    amountPaise: number = 99900,
    name: string = "QrSlice Complete",
    period: "monthly" | "yearly" = "monthly",
  ) =>
    rp("POST", "/plans", {
      period,
      interval: 1,
      item: {
        name,
        amount: amountPaise,
        currency: "INR",
        description: `QrSlice Restaurant Operating System - ${period === "yearly" ? "Yearly" : "Monthly"} Subscription`,
      },
    }),

  createSubscription: (
    customerId: string | null | undefined,
    planId: string,
    notes: any,
  ) => {
    const payload: any = {
      plan_id: planId,
      total_count: 120,
      customer_notify: 1,
      notes,
    };
    // Razorpay requires a valid customer ID if passed. If none, omit it.
    if (
      customerId &&
      customerId.startsWith("cust_") &&
      !customerId.startsWith("cust_sim_") &&
      customerId !== "cust_guest"
    ) {
      payload.customer_id = customerId;
    }
    return rp("POST", "/subscriptions", payload);
  },

  createPaymentLink: (options: {
    amount: number;
    description: string;
    customer?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, any>;
    callbackUrl?: string;
  }) => {
    return rp("POST", "/payment_links", {
      amount: options.amount,
      currency: "INR",
      accept_partial: false,
      description: options.description,
      customer: options.customer,
      notes: options.notes,
      callback_url: options.callbackUrl,
      callback_method: "get",
      notify: { sms: false, email: true },
    });
  },

cancelSubscription: (subId: string) =>
    rp("POST", `/subscriptions/${subId}/cancel`, { cancel_at_cycle_end: 0 }),

  // Standard Checkout: create a one-time order for subscription payment
  // Amount must be >= 100 paise (₹1)
  createOrder: (amountPaise: number, currency: string = "INR", receipt?: string, notes?: Record<string, string>) => {
    const amount = Math.round(Number(amountPaise) || 0);
    if (amount < 100) {
      return { error: "Minimum amount for Razorpay checkout is 100 paise (₹1).", status: 400 };
    }
    return rp("POST", "/orders", {
      amount,
      currency,
      receipt: receipt || undefined,
      notes: notes || undefined,
    });
  },

  // Standard Checkout: verify HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  verifyPaymentSignature: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is missing.");
    }
    const expected = crypto
      .createHmac("sha256", secret.trim())
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(String(razorpaySignature || ""), "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },

  verifyWebhook: (rawBody: string, signature: string) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is missing.");
    }
    const expected = crypto
      .createHmac("sha256", secret.replace(/^"|"$/g, ""))
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  },
};

