// Copyright (c) 2026 QRslice. All rights reserved.
import type { SessionUser } from "@/lib/auth";

type PlatformRole = "super_admin" | "support";
type PlatformUser = Pick<SessionUser, "role"> & { permissions?: Record<string, boolean>; is_active?: boolean };

export function requirePermission(user: PlatformUser | null, perm: string): boolean {
  if (!user) return false;
  if (user.is_active === false) return false;
  if ((user.role as PlatformRole) === "super_admin") return true;
  return user.permissions?.[perm] === true;
}
