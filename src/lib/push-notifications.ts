// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Web Push subscription helpers (PWA push notifications).
 *
 * All functions are graceful no-ops (resolve null/false) when push is
 * unsupported, permission is denied, or the VAPID public key is missing.
 * Never logs subscription endpoints, keys, or payloads.
 */

export interface PushKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushKeys;
}

function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return key && key.length > 0 ? key : null;
}

/** Whether Web Push can be attempted in this browser. */
export function isPushSupported(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    getVapidPublicKey() !== null
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = globalThis.atob(base64.replaceAll("-", "+").replaceAll("_", "/") + padding);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function toPayload(sub: globalThis.PushSubscription): PushSubscriptionPayload | null {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}

/**
 * Subscribe the current device for push. Returns the stored subscription
 * payload, or null when push is unavailable/denied (graceful no-op).
 * Persists the subscription server-side via POST /api/push/subscribe.
 */
export async function subscribeToPush(): Promise<PushSubscriptionPayload | null> {
  try {
    if (!isPushSupported()) return null;
    if (Notification.permission === "denied") return null;
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return null;
    }

    const vapidKey = getVapidPublicKey();
    if (!vapidKey) return null;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
    }

    const payload = toPayload(subscription);
    if (!payload) return null;

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Remove the current device's push subscription, server-side and locally.
 * Returns true when a subscription was removed, false otherwise.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const endpoint = subscription.endpoint;
    try {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    } catch {
      // Server-side removal is best-effort; still unsubscribe locally.
    }
    return await subscription.unsubscribe();
  } catch {
    return false;
  }
}
