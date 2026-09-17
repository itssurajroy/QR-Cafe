// Copyright (c) 2026 QRslice. All rights reserved.
/* eslint-disable no-restricted-globals */
/**
 * QRslice service worker (custom, dependency-free).
 *
 * Decision: used instead of `next-pwa` (see Phase 1 notes). next-pwa 5.6.0
 * is unmaintained (published ~4 years ago, workbox v6, webpack-only) and has
 * no support for Next.js 16 App Router / Turbopack. A small vanilla SW gives
 * us the exact caching strategies we need with zero build-time risk.
 *
 * Strategies:
 * - Navigation            → NetworkFirst, offline fallback to /offline
 * - Google Fonts          → CacheFirst, 365 days
 * - Unsplash images       → CacheFirst, 30 days, max 200 entries
 * - Supabase (*.supabase.co) → NetworkFirst (10s timeout), 24h cache
 * - Static images         → CacheFirst, 30 days, max 500 entries
 * - /api/* mutations      → NetworkOnly (never cached)
 * - /api/* GETs           → NetworkFirst (10s timeout), 5min cache
 */

const SW_VERSION = "qrslice-sw-v2";
const PRECACHE = `${SW_VERSION}-precache`;
const RUNTIME = `${SW_VERSION}-runtime`;
const FONTS_CACHE = `${SW_VERSION}-fonts`;
const IMAGES_CACHE = `${SW_VERSION}-images`;
const SUPABASE_CACHE = `${SW_VERSION}-supabase`;
const API_CACHE = `${SW_VERSION}-api`;

const PRECACHE_URLS = [
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
];

const DAY_MS = 24 * 60 * 60 * 1000;
const TTL = {
  fonts: 365 * DAY_MS,
  unsplash: 30 * DAY_MS,
  supabase: 1 * DAY_MS,
  images: 30 * DAY_MS,
  apiGet: 5 * 60 * 1000,
};
const MAX_ENTRIES = {
  fonts: 100,
  unsplash: 200,
  images: 500,
  supabase: 100,
  apiGet: 50,
};
const NETWORK_TIMEOUT_MS = 10 * 1000;

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isCacheable(response) {
  return !!response && (response.ok || response.type === "opaque");
}

/** Freshness check via the Date header (opaque responses have none → treated as fresh). */
function isFresh(response, ttlMs) {
  if (!response || ttlMs == null) return true;
  const dateHeader = response.headers.get("date");
  if (!dateHeader) return true;
  const age = Date.now() - new Date(dateHeader).getTime();
  return !Number.isNaN(age) && age < ttlMs;
}

async function trimCache(cacheName, maxEntries) {
  if (!maxEntries) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const excess = keys.slice(0, keys.length - maxEntries);
    await Promise.all(excess.map((key) => cache.delete(key)));
  }
}

async function putInCache(cacheName, request, response, maxEntries) {
  if (!isCacheable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  await trimCache(cacheName, maxEntries);
}

async function cacheFirst(request, cacheName, { ttlMs, maxEntries } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && isFresh(cached, ttlMs)) return cached;
  try {
    const network = await fetch(request);
    await putInCache(cacheName, request, network, maxEntries);
    return network;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName, { timeoutMs, ttlMs, maxEntries } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const network = await fetchWithTimeout(request, timeoutMs ?? NETWORK_TIMEOUT_MS);
    await putInCache(cacheName, request, network, maxEntries);
    return network;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function handleNavigation(request) {
  try {
    const network = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);
    if (isCacheable(network)) {
      const cache = await caches.open(RUNTIME);
      await cache.put(request, network.clone());
    }
    return network;
  } catch {
    const cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;
    const offline = await caches.match("/offline");
    if (offline) return offline;
    return new Response("Offline — please reconnect and retry.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // allSettled: a single missing asset must not fail installation.
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (isCacheable(res)) await cache.put(url, res);
          } catch {
            // ignore precache misses (e.g. first install while offline)
          }
        }),
      );
    })(),
  );
  // Do NOT skipWaiting automatically — updates are user-confirmed via the
  // SWUpdateToast (SKIP_WAITING message). First install activates on its own
  // since there is no controlling worker yet.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("qrslice-sw-") && !name.startsWith(SW_VERSION))
          .map((name) => caches.delete(name)),
      );
      try {
        if ("navigationPreload" in self.registration) {
          await self.registration.navigationPreload.enable();
        }
      } catch {
        // navigation preload unsupported — non-fatal
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Background Sync: replay the IndexedDB offline order queue.
//
// NOTE: the SW cannot import from src/ (separate runtime, no bundler for
// public/sw.js), so the minimal IndexedDB + replay logic from
// src/lib/offline-queue.ts is duplicated here. Schema must stay identical:
// DB "qrslice-offline", v1, stores "orders" (keyPath id, index by-created on
// createdAt) and "syncStatus" (keyPath key). MAX_RETRIES = 5.
//
// Never logs order payloads or PII — only queue counts.
// ---------------------------------------------------------------------------

const SYNC_ORDERS_TAG = "sync-orders";
const PERIODIC_SYNC_ORDERS_TAG = "periodic-sync-orders";
const OFFLINE_DB_NAME = "qrslice-offline";
const OFFLINE_DB_VERSION = 1;
const SYNC_MAX_RETRIES = 5;

function openOfflineQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("orders")) {
        const store = db.createObjectStore("orders", { keyPath: "id" });
        store.createIndex("by-created", "createdAt");
      }
      if (!db.objectStoreNames.contains("syncStatus")) {
        db.createObjectStore("syncStatus", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function replayOfflineQueue() {
  let db;
  try {
    db = await openOfflineQueueDB();
  } catch {
    return;
  }
  try {
    let orders = [];
    try {
      const tx = db.transaction("orders", "readonly");
      const store = tx.objectStore("orders");
      if (store.indexNames.contains("by-created")) {
        orders = await idbRequestToPromise(store.index("by-created").getAll());
      } else {
        orders = await idbRequestToPromise(store.getAll());
        orders.sort((a, b) => a.createdAt - b.createdAt);
      }
    } catch {
      return;
    }
    if (!orders.length) return;

    for (const order of orders) {
      try {
        const response = await fetch(order.endpoint, {
          method: order.method || "POST",
          headers: order.headers || { "Content-Type": "application/json" },
          body: JSON.stringify(order.payload),
        });
        if (response.ok) {
          const tx = db.transaction("orders", "readwrite");
          tx.objectStore("orders").delete(order.id);
          await new Promise((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
          });
        } else {
          order.retryCount = (order.retryCount || 0) + 1;
          const tx = db.transaction("orders", "readwrite");
          const store = tx.objectStore("orders");
          if (order.retryCount >= SYNC_MAX_RETRIES) {
            store.delete(order.id);
          } else {
            store.put(order);
          }
          await new Promise((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
          });
        }
      } catch {
        order.retryCount = (order.retryCount || 0) + 1;
        try {
          const tx = db.transaction("orders", "readwrite");
          const store = tx.objectStore("orders");
          if (order.retryCount >= SYNC_MAX_RETRIES) {
            store.delete(order.id);
          } else {
            store.put(order);
          }
          await new Promise((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
          });
        } catch {
          // ignore — next sync will retry
        }
      }
    }

    try {
      const countReq = db.transaction("orders", "readonly").objectStore("orders").count();
      const pendingCount = await idbRequestToPromise(countReq);
      const tx = db.transaction("syncStatus", "readwrite");
      tx.objectStore("syncStatus").put({ key: "main", lastSync: Date.now(), pendingCount });
      await new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      });
    } catch {
      // sync status is best-effort metadata
    }
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_ORDERS_TAG) {
    event.waitUntil(replayOfflineQueue());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === PERIODIC_SYNC_ORDERS_TAG) {
    event.waitUntil(replayOfflineQueue());
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!request.url.startsWith("http")) return;
  const url = new URL(request.url);

  // Mutations (and any non-GET) are never cached — the IndexedDB offline
  // queue in src/lib/offline-queue.ts handles retries instead.
  if (request.method !== "GET") {
    event.respondWith(fetch(request));
    return;
  }

  // Navigations: NetworkFirst + /offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Same-origin API GETs: NetworkFirst, short TTL.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(
      networkFirst(request, API_CACHE, {
        timeoutMs: NETWORK_TIMEOUT_MS,
        ttlMs: TTL.apiGet,
        maxEntries: MAX_ENTRIES.apiGet,
      }),
    );
    return;
  }

  // Google Fonts: CacheFirst, 1 year.
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      cacheFirst(request, FONTS_CACHE, { ttlMs: TTL.fonts, maxEntries: MAX_ENTRIES.fonts }),
    );
    return;
  }

  // Unsplash: CacheFirst, 30 days, max 200.
  if (url.hostname.includes("unsplash")) {
    event.respondWith(
      cacheFirst(request, IMAGES_CACHE, { ttlMs: TTL.unsplash, maxEntries: MAX_ENTRIES.unsplash }),
    );
    return;
  }

  // Supabase: NetworkFirst (10s timeout), 24h cache.
  if (url.hostname.endsWith(".supabase.co")) {
    event.respondWith(
      networkFirst(request, SUPABASE_CACHE, {
        timeoutMs: NETWORK_TIMEOUT_MS,
        ttlMs: TTL.supabase,
        maxEntries: MAX_ENTRIES.supabase,
      }),
    );
    return;
  }

  // Static images: CacheFirst, 30 days, max 500.
  if (
    request.destination === "image" ||
    /\.(png|jpe?g|svg|webp|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      cacheFirst(request, IMAGES_CACHE, { ttlMs: TTL.images, maxEntries: MAX_ENTRIES.images }),
    );
    return;
  }

  // Everything else: passthrough (Next.js chunks, RSC payloads, etc.).
});
