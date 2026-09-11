"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useWakeLock — keeps the screen awake while the component is mounted.
 * Uses the Screen Wake Lock API (`navigator.wakeLock.request("screen")`).
 * Silently no-ops on unsupported browsers; re-requests the lock when the
 * tab becomes visible again (locks are released on minimize/hide).
 *
 * Returns whether a lock is currently held (useful for a status dot).
 */
export function useWakeLock(enabled = true): boolean {
  const [held, setHeld] = useState(false);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const request = async () => {
      try {
        if (!("wakeLock" in navigator) || document.visibilityState !== "visible") {
          return;
        }
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release().catch(() => {});
          return;
        }
        lockRef.current = sentinel;
        setHeld(true);
        sentinel.addEventListener("release", () => {
          if (lockRef.current === sentinel) {
            lockRef.current = null;
            setHeld(false);
          }
        });
      } catch {
        // Unsupported browser or denied — stay unlocked, never throw.
        setHeld(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !lockRef.current) {
        void request();
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      const sentinel = lockRef.current;
      lockRef.current = null;
      if (sentinel) {
        void sentinel.release().catch(() => {});
      }
      setHeld(false);
    };
  }, [enabled]);

  return held;
}
