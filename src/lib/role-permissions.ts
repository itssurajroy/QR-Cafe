// Copyright (c) 2026 QRslice. All rights reserved.
export type TenantRole = "owner" | "manager" | "staff";

export const ROLE_BADGES: Record<TenantRole, { label: string; badge: string; icon: string }> = {
  owner: { label: "Owner", badge: "bg-amber-100 text-amber-800 border-amber-300", icon: "👑" },
  manager: { label: "Manager", badge: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: "🛡️" },
  staff: { label: "Staff", badge: "bg-slate-100 text-slate-700 border-slate-300", icon: "👤" },
};

/**
 * 3-Tier Tab Permissions Matrix
 */
export const ALLOWED_TABS: Record<TenantRole, Set<string>> = {
  staff: new Set([
    "orders",
    "kitchen",
    "kds",
    "tables",
    "bookings",
    "reservations",
    "support",
    "help",
  ]),
  manager: new Set([
    "dashboard",
    "orders",
    "kitchen",
    "kds",
    "tables",
    "bookings",
    "reservations",
    "menu",
    "categories",
    "modifiers",
    "inventory",
    "recipes",
    "analytics",
    "report",
    "crm",
    "staff",
    "support",
    "help",
  ]),
  owner: new Set([
    "dashboard",
    "orders",
    "kitchen",
    "kds",
    "tables",
    "bookings",
    "reservations",
    "menu",
    "categories",
    "modifiers",
    "inventory",
    "recipes",
    "analytics",
    "report",
    "crm",
    "staff",
    "settings",
    "account",
    "branding",
    "integrations",
    "webhooks",
    "billing",
    "support",
    "help",
  ]),
};

export function canAccessTab(role: string | null | undefined, tab: string): boolean {
  const normalizedRole: TenantRole =
    role === "owner" ? "owner" : role === "manager" || role === "admin" ? "manager" : "staff";
  return ALLOWED_TABS[normalizedRole].has(tab);
}

export function getDefaultTabForRole(role: string | null | undefined): string {
  const normalizedRole: TenantRole =
    role === "owner" ? "owner" : role === "manager" || role === "admin" ? "manager" : "staff";
  return normalizedRole === "staff" ? "orders" : "dashboard";
}

export function getRoleBadge(role: string | null | undefined) {
  const normalizedRole: TenantRole =
    role === "owner" ? "owner" : role === "manager" || role === "admin" ? "manager" : "staff";
  return ROLE_BADGES[normalizedRole];
}
