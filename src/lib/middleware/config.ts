// Copyright (c) 2026 QRslice. All rights reserved.

export const MIDDLEWARE_CONFIG = {
  // Routes that should completely bypass auth checks
  publicPaths: [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/faq",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refund",
    "/legal/cookies",
    "/login",
    "/onboarding",
    "/favicon.png",
    "/logo.png",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/billing/webhook",
  ],
  // Routes for super admin only
  superPaths: ["/super", "/api/super"],
  // Routes for cafe owners/staff
  adminPaths: ["/admin", "/api/admin", "/pos", "/api/pos", "/api/analytics"],
  // Guest storefront routes (tenant resolved, but no cafe staff auth needed)
  guestPaths: ["/c/", "/t/", "/order/", "/receipt/", "/api/orders", "/api/order-status", "/api/table-service", "/api/kds", "/api/bookings"],
};

export function isPublicPath(path: string): boolean {
  if (MIDDLEWARE_CONFIG.publicPaths.includes(path)) return true;
  if (MIDDLEWARE_CONFIG.guestPaths.some((p) => path.startsWith(p))) return true;
  // Match exact marketing paths or simple static extensions not covered by matcher
  if (path.match(/\.(png|jpg|jpeg|svg|ico)$/)) return true;
  return false;
}

export function isSuperAdminPath(path: string): boolean {
  return MIDDLEWARE_CONFIG.superPaths.some((p) => path.startsWith(p));
}

export function isAdminOrPosPath(path: string): boolean {
  return MIDDLEWARE_CONFIG.adminPaths.some((p) => path.startsWith(p));
}

export function isApiRoute(path: string): boolean {
  return path.startsWith("/api");
}

