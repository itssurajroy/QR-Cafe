// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/auth";

export type PosGuardResult =
  | { ok: true; user: SessionUser; response?: undefined }
  | { ok: false; user?: undefined; response: NextResponse };

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

async function loadSessionUser(): Promise<SessionUser | null> {
  // Dynamic import keeps `server-only` (via @/lib/auth) out of unit-test graphs.
  const { getSessionUser } = await import("@/lib/auth");
  return getSessionUser();
}

/** Session + tenant restaurant required (POS/API routes). */
export async function requireTenant(): Promise<PosGuardResult> {
  const user = await loadSessionUser();
  if (!user || !user.restaurantId) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, user };
}

/** Session + one of the allowed roles (and tenant when requireTenant). */
export async function requireRole(
  roles: readonly SessionUser["role"][],
  opts: { tenant?: boolean } = { tenant: true },
): Promise<PosGuardResult> {
  const user = await loadSessionUser();
  if (!user) {
    return { ok: false, response: unauthorized() };
  }
  if (opts.tenant !== false && !user.restaurantId) {
    return { ok: false, response: unauthorized() };
  }
  if (!roles.includes(user.role)) {
    return {
      ok: false,
      response: forbidden(`Forbidden: requires one of: ${roles.join(", ")}`),
    };
  }
  return { ok: true, user };
}

/** Roles allowed to settle / manage payment status on POS. */
export const POS_SETTLE_ROLES = [
  "owner",
  "manager",
  "super_admin",
] as const satisfies readonly SessionUser["role"][];

/** Roles allowed to mutate floor layout ops (transfer table, etc.). */
export const POS_FLOOR_ROLES = [
  "owner",
  "manager",
  "super_admin",
  "staff",
  "waiter",
] as const satisfies readonly SessionUser["role"][];

/** Roles allowed to create/advance kitchen-facing order status (not payment). */
export const POS_ORDER_ROLES = [
  "owner",
  "manager",
  "super_admin",
  "staff",
  "waiter",
  "kitchen",
] as const satisfies readonly SessionUser["role"][];

export function canSettle(user: Pick<SessionUser, "role">): boolean {
  return (POS_SETTLE_ROLES as readonly string[]).includes(user.role);
}

export function canManageFloor(user: Pick<SessionUser, "role">): boolean {
  return (POS_FLOOR_ROLES as readonly string[]).includes(user.role);
}
