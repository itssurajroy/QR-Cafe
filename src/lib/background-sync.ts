// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Background Sync registration helpers for the offline order queue.
 *
 * All functions are fire-and-forget and failure-silent: shared POS
 * terminals and iOS Safari (no Background Sync support) must never see
 * errors from these paths.
 */

export const SYNC_ORDERS_TAG = "sync-orders";
export const PERIODIC_SYNC_ORDERS_TAG = "periodic-sync-orders";
const PERIODIC_SYNC_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Narrow local declarations — TS DOM lib may not include these yet. */
interface SyncManagerLike {
  register(tag: string): Promise<void>;
}

interface PeriodicSyncManagerLike {
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  readonly sync?: SyncManagerLike;
  readonly periodicSync?: PeriodicSyncManagerLike;
}

function getSyncCapableRegistration(): Promise<ServiceWorkerRegistrationWithSync | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.ready.then(
    (reg) => reg as ServiceWorkerRegistrationWithSync,
    () => null,
  );
}

/**
 * Register one-shot background sync for queued orders.
 * Silent no-op when unsupported or when registration fails.
 */
export async function registerOrderSync(): Promise<void> {
  try {
    const reg = await getSyncCapableRegistration();
    if (!reg || !("sync" in reg) || !reg.sync) {
      console.debug("[qrslice] Background Sync not supported — skipping order sync registration");
      return;
    }
    await reg.sync.register(SYNC_ORDERS_TAG);
  } catch {
    console.debug("[qrslice] Background Sync registration failed — will retry on reconnect");
  }
}

/**
 * Register periodic background sync for queued orders (best-effort).
 * Silent no-op when unsupported, permission not granted, or registration fails.
 */
export async function registerPeriodicOrderSync(): Promise<void> {
  try {
    const reg = await getSyncCapableRegistration();
    if (!reg || !("periodicSync" in reg) || !reg.periodicSync) {
      console.debug("[qrslice] Periodic Background Sync not supported — skipping");
      return;
    }
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      try {
        const status = await navigator.permissions.query({
          // "periodic-background-sync" is not in TS DOM lib PermissionName yet.
          name: "periodic-background-sync" as PermissionName,
        });
        if (status.state !== "granted") {
          console.debug("[qrslice] Periodic Background Sync permission not granted — skipping");
          return;
        }
      } catch {
        // Permissions API query unsupported for this name — fall through and
        // attempt registration; failures below are silent no-ops.
      }
    }
    await reg.periodicSync.register(PERIODIC_SYNC_ORDERS_TAG, {
      minInterval: PERIODIC_SYNC_MIN_INTERVAL_MS,
    });
  } catch {
    console.debug("[qrslice] Periodic Background Sync registration failed — skipping");
  }
}

/** Whether one-shot Background Sync registration is available in this browser. */
export function isBackgroundSyncSupported(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "SyncManager" in window;
}
