// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

/**
 * SWRegister — registers the QRslice service worker.
 * Mounted once from the root layout. Production-only so dev caching
 * never serves stale chunks while iterating.
 */
import { useEffect } from "react";
import { registerPeriodicOrderSync } from "@/lib/background-sync";

export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (!cancelled && registration) {
          // Proactively check for updates on navigation focus.
          registration.update().catch(() => {});
          // Best-effort periodic replay of the offline order queue.
          // Guarded + failure-silent inside; fire-and-forget, no UI.
          void registerPeriodicOrderSync();
        }
      } catch {
        // SW registration is best-effort (e.g. unsupported browser).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
