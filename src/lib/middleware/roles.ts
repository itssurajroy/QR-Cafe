// Copyright (c) 2026 QRslice. All rights reserved.

export function checkRoleAccess(
  path: string, 
  profile: any | null, 
  tenantId: string | null
): { allowed: boolean; redirect?: string; error?: string } {
  // If no profile is active, block everything that requires role
  if (!profile || !profile.active) {
    return { allowed: false, redirect: "/login", error: "Inactive or missing profile" };
  }

  const isSuperAdminRoute = path.startsWith("/super") || path.startsWith("/api/super");
  const isAdminOrPosRoute = path.startsWith("/admin") || path.startsWith("/pos") || 
                            path.startsWith("/api/admin") || path.startsWith("/api/pos");

  if (isSuperAdminRoute) {
    if (profile.role !== "super_admin") {
      return { allowed: false, error: "Super Admin privileges required" };
    }
  }

  if (isAdminOrPosRoute && profile.role !== "super_admin") {
    // Regular admin or staff must belong to the tenant they are accessing
    // Or if path doesn't specify tenant, they just need an active restaurant_id
    if (!profile.restaurant_id) {
      return { allowed: false, redirect: "/onboarding", error: "No restaurant assigned" };
    }
    
    // If a tenant was resolved from the URL, ensure it matches the user's tenant
    if (tenantId && tenantId !== profile.restaurant_id) {
      return { allowed: false, error: "Access denied to this tenant's dashboard" };
    }
  }

  return { allowed: true };
}

