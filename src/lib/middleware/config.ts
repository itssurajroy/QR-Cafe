// Copyright (c) 2026 QRslice. All rights reserved.

export const MIDDLEWARE_CONFIG = {
  // Routes that should completely bypass auth checks
  publicPaths: [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/careers",
    "/faq",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refund",
    "/legal/shipping-delivery",
    "/legal/grievance",
    "/legal/cookies",
    "/login",
    "/onboarding",
    "/offline",
    "/sw.js",
    "/manifest.json",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/favicon.png",
    "/favicon.ico",
    "/logo.png",
    "/apple-touch-icon.png",
    "/og-image.png",
    "/icon-192.png",
    "/icon-512.png",
    "/api/auth/login",
    "/api/auth/pin",
    "/api/auth/logout",
    "/api/billing/webhook",
    "/api/onboarding",
    "/api/feedback",
    "/api/contact",
    "/api/leads/whatsapp",
  ],
  // Routes for super admin only
  superPaths: ["/super", "/api/super"],
  // Routes for cafe owners/staff
  adminPaths: ["/admin", "/api/admin", "/pos", "/api/pos", "/api/kds", "/api/analytics"],
  // Guest storefront routes (tenant resolved, but no cafe staff auth needed)
  guestPaths: [
    "/c/",
    "/t/",
    "/order/",
    "/receipt/",
    "/api/orders",
    "/api/order-status",
    "/api/table-service",
    "/api/bookings",
    "/api/public/",
    "/api/whatsapp/log-event",
  ],
};

export function isPublicPath(path: string): boolean {
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  if (MIDDLEWARE_CONFIG.publicPaths.includes(normalized)) return true;
  if (MIDDLEWARE_CONFIG.guestPaths.some((p) => normalized.startsWith(p) || path.startsWith(p))) return true;
  // Match exact marketing paths or simple static extensions not covered by matcher
  if (normalized.match(/\.(png|jpg|jpeg|svg|ico|webp|txt|xml|json)$/)) return true;
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

