import crypto from "crypto";

const KEY = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const SECRET = process.env.RAZORPAY_KEY_SECRET || "secret_placeholder";
const auth = Buffer.from(`${KEY}:${SECRET}`).toString("base64");

async function rp(method: string, path: string, body?: any) {
  // If in mock/placeholder mode without real keys, return simulated responses
  if (KEY === "rzp_test_placeholder" || SECRET === "secret_placeholder") {
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

  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return r.json();
}

export const razorpay = {
  createCustomer: (email: string, name: string) =>
    rp("POST", "/customers", { email, name }),

  createSubscription: (customerId: string, planId: string, notes: any) =>
    rp("POST", "/subscriptions", {
      customer_id: customerId,
      plan_id: planId,
      total_count: 120,
      notes,
    }),

  cancelSubscription: (subId: string) =>
    rp("POST", `/subscriptions/${subId}/cancel`, { cancel_at_cycle_end: 0 }),

  verifyWebhook: (rawBody: string, signature: string) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_placeholder";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  },
};
