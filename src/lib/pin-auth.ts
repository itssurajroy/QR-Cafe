// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Staff PIN quick sign-in (4-digit codes for shared terminals).
 *
 * Design:
 * - Only the PIN *hash* is stored in cafe_profiles.pin_hash.
 * - Hash = HMAC-SHA256(APP_CRYPTO_SECRET, `${restaurantId}:${profileId}:${pin}`).
 *   Binding to restaurant + profile stops rainbow tables and cross-staff reuse.
 * - PIN sessions are stateless signed tokens (payload + HMAC), stored in the
 *   `qrslice_pin` httpOnly cookie. Verified in both Node routes and Edge
 *   middleware, so this module uses Web Crypto (`crypto.subtle`) only.
 */

export const PIN_SESSION_COOKIE = "qrslice_pin";
export const PIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h terminal shift

export type PinSessionPayload = {
  sub: string; // cafe_profiles.id
  rid: string; // restaurant_id
  role: string;
  exp: number; // epoch ms
};

function getSecret(override?: string): string {
  const secret = override ?? process.env.APP_CRYPTO_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      "APP_CRYPTO_SECRET is required for PIN operations. Add it to .env.local as APP_CRYPTO_SECRET=<value>",
    );
  }
  return secret;
}

export function validatePinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic peppered hash for storage. Never store or log the raw PIN. */
export async function hashPin(
  pin: string,
  restaurantId: string,
  profileId: string,
  secretOverride?: string,
): Promise<string> {
  if (!validatePinFormat(pin)) throw new Error("PIN must be exactly 4 digits");
  return hmacHex(getSecret(secretOverride), `${restaurantId}:${profileId}:${pin}`);
}

/** Constant-time comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPinHash(
  pin: string,
  restaurantId: string,
  profileId: string,
  expectedHash: string,
  secretOverride?: string,
): Promise<boolean> {
  if (!validatePinFormat(pin) || !expectedHash) return false;
  const actual = await hashPin(pin, restaurantId, profileId, secretOverride);
  return safeEqual(actual, expectedHash);
}

function b64urlEncode(obj: unknown): string {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode<T>(s: string): T | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

/** Create a signed PIN session token (stateless, 12h expiry by default). */
export async function signPinSession(
  payload: Omit<PinSessionPayload, "exp"> & { exp?: number },
  secretOverride?: string,
  ttlMs: number = PIN_SESSION_TTL_MS,
): Promise<string> {
  const body = b64urlEncode({
    ...payload,
    exp: payload.exp ?? Date.now() + ttlMs,
  });
  const sig = await hmacHex(getSecret(secretOverride), body);
  return `${body}.${sig.slice(0, 64)}`;
}

/** Verify a PIN session token. Returns payload or null (tampered/expired/malformed). */
export async function verifyPinSession(
  token: string,
  secretOverride?: string,
): Promise<PinSessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let expected: string;
  try {
    expected = (await hmacHex(getSecret(secretOverride), body)).slice(0, 64);
  } catch {
    return null;
  }
  if (!safeEqual(sig, expected)) return null;
  const payload = b64urlDecode<PinSessionPayload>(body);
  if (!payload || !payload.sub || !payload.rid || !payload.role || !payload.exp) return null;
  if (Date.now() > payload.exp) return null;
  return payload;
}
