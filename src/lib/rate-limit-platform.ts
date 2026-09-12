// Copyright (c) 2026 QRslice. All rights reserved.

const hits = new Map<string, number[]>();

export function checkPlatformRateLimit(actorId: string, action: string, limit = 10, windowMs = 60_000): { ok: boolean } {
  const key = `${actorId}:${action}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return { ok: false };
  arr.push(now);
  hits.set(key, arr);
  return { ok: true };
}
