import crypto from "crypto";

async function rp(method: string, path: string, body?: any) {
  const key = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
  const secret = process.env.RAZORPAY_KEY_SECRET || "secret_placeholder";

  // If in mock/placeholder mode without real keys, return simulated responses
  if (
    !key ||
    !secret ||
    key === "rzp_test_placeholder" ||
    secret === "secret_placeholder"
  ) {
    if (path.startsWith("/plans")) {
      return { id: `plan_sim_${Date.now()}`, period: "monthly", interval: 1 };
    }
    if (path.startsWith("/customers")) {
      return { id: `cust_sim_${Date.now()}`, email: body?.email, name: body?.name };
    }
    if (path.startsWith("/subscriptions")) {
      return {
        id: `sub_sim_${Date.now()}`,
        short_url: `https://rzp.io/i/sim_${Date.now()}`,
        status: "authenticated",
      };
    }
    return { ok: true };
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

  cancelSubscription: (subId: string) =>
    rp("POST", `/subscriptions/${subId}/cancel`, { cancel_at_cycle_end: 0 }),

  verifyWebhook: (rawBody: string, signature: string) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_placeholder";
    const expected = crypto
      .createHmac("sha256", secret.replace(/^"|"$/g, ""))
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  },
};
