// In-memory rate limiter with automated LRU/TTL cleanup to prevent unbounded memory growth.
const hits = new Map<string, { count: number; reset: number }>();
let lastCleanup = Date.now();

function evictStale(now: number) {
  if (now - lastCleanup < 60_000 && hits.size < 5000) return;
  lastCleanup = now;
  for (const [k, v] of hits.entries()) {
    if (now > v.reset) {
      hits.delete(k);
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  evictStale(now);

  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    hits.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { ok: true, retryAfter: 0 };
  }
  rec.count += 1;
  if (rec.count > limit) {
    return { ok: false, retryAfter: Math.ceil((rec.reset - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

