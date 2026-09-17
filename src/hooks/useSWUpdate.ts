// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

/**
 * useSWUpdate — detects a waiting service worker and applies it on demand.
 * Returns { updateAvailable, reload }: set an update toast on
 * `updateAvailable`, call `reload()` to SKIP_WAITING + refresh.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useSWUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const reloadRequestedRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const trackWaiting = (registration: ServiceWorkerRegistration) => {
      const waiting = registration.waiting;
      if (waiting && navigator.serviceWorker.controller) {
        waitingRef.current = waiting;
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.ready
      .then((registration) => {
        if (cancelled) return;
        trackWaiting(registration);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (cancelled) return;
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingRef.current = registration.waiting ?? installing;
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch(() => {});

    const onControllerChange = () => {
      // Only auto-reload when the user confirmed the update — avoids a
      // surprise reload on first-install claim.
      if (reloadRequestedRef.current) {
        reloadRequestedRef.current = false;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const reload = useCallback(() => {
    const waiting = waitingRef.current;
    reloadRequestedRef.current = true;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
      // Fallback: if controllerchange never fires, still refresh.
      setTimeout(() => {
        if (reloadRequestedRef.current) {
          reloadRequestedRef.current = false;
          window.location.reload();
        }
      }, 2500);
    } else {
      window.location.reload();
    }
  }, []);

  return { updateAvailable, reload };
}
