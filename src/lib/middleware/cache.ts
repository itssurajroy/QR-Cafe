// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * A lightweight, Edge-compatible in-memory cache to reduce Supabase queries
 * for tenant metadata and auth profiles during a request lifecycle or across 
 * rapidly concurrent requests in the same edge isolate.
 */
class EdgeCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private ttlMs: number;

  constructor(ttlMs = 15000) { // 15 seconds default TTL
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Global cache instances that persist across some requests in the same isolate
export const tenantCache = new EdgeCache<any>(30000); // 30 seconds for tenant metadata
export const profileCache = new EdgeCache<any>(15000); // 15 seconds for auth roles
export const consentCache = new EdgeCache<any>(15000); // 15 seconds for consent state

