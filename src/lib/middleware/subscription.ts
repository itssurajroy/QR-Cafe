// Copyright (c) 2026 QRslice. All rights reserved.

export function checkSubscriptionAccess(
  path: string,
  tenant: any | null,
  role: string | null
): { allowed: boolean; redirect?: string; error?: string } {
  // Super admins bypass subscription gates
  if (role === "super_admin") return { allowed: true };

  // If no tenant is resolved, we can't check subscription. 
  // It's likely a global route or 404 territory handled elsewhere.
  if (!tenant) return { allowed: true };

  // Only operational routes are gated by subscription (POS, KDS, Admin)
  const isOperationalRoute = path.startsWith("/admin") || path.startsWith("/pos") || path.startsWith("/api/pos");
  const isBillingRoute = path.startsWith("/admin/billing") || path.startsWith("/api/billing");

  // We allow billing routes even if expired
  if (isOperationalRoute && !isBillingRoute) {
    let state = "expired";
    if (tenant.plan === "active") state = "active";
    else if (tenant.plan === "suspended") state = "suspended";
    else if (tenant.plan === "trial") {
      if (!tenant.trial_ends_at || new Date(tenant.trial_ends_at).getTime() > Date.now()) {
        state = "trial";
      }
    }

    if (state === "expired" || state === "suspended") {
      return { 
        allowed: false, 
        redirect: "/admin/billing", 
        error: `Subscription ${state}` 
      };
    }
  }

  // Guest order logic: if tenant expired, disable ordering but allow viewing menu.
  // We can pass a header x-tenant-status to inform the guest frontend.
  return { allowed: true };
}

