export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "suspended";

// Maps operational plan (+ trial expiry) to the subscription_status column.
// Super-admin writes set both columns from this single function — never set one without the other.
export function planToSubscriptionStatus(plan: string, trialEndsAt: string | null): SubscriptionStatus {
  if (plan === "active" || plan === "suspended" || plan === "cancelled") return plan;
  if (plan === "trial") {
    if (!trialEndsAt) return "trial";
    return new Date(trialEndsAt).getTime() > Date.now() ? "trial" : "expired";
  }
  return "expired";
}
