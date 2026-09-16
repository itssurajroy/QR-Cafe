// Copyright (c) 2026 QRslice. All rights reserved.
import crypto from "crypto";

// Dedicated cryptographic secret for HMAC operations.
// MUST NOT reuse SUPABASE_SERVICE_ROLE_KEY — if an HMAC key leaks through a
// log trace or side-channel, it should only allow forging receipt stamps, not
// grant full database admin access (which the service role key would).
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const CRYPTO_SECRET = process.env.APP_CRYPTO_SECRET as string;

if (!CRYPTO_SECRET) {
  throw new Error(
    "APP_CRYPTO_SECRET is required for cryptographic operations. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
    "and add it to .env.local as APP_CRYPTO_SECRET=<value>",
  );
}

/**
 * Generates an HMAC-SHA256 signature for a table token or session.
 */
export function signTableToken(tableId: string, restaurantId: string): string {
  const data = `${tableId}:${restaurantId}`;
  return crypto.createHmac("sha256", CRYPTO_SECRET).update(data).digest("hex").slice(0, 16);
}

/**
 * Constant-time safe verification of a token signature to prevent timing attacks.
 */
export function verifyTableTokenSignature(
  signature: string,
  tableId: string,
  restaurantId: string,
): boolean {
  if (!signature || signature.length !== 16) return false;
  const expected = signTableToken(tableId, restaurantId);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Computes a deterministic SHA-256 checksum of an order payload.
 */
export function computeOrderChecksum(items: Array<{ menu_item_id: string; quantity: number }>): string {
  const normalized = items
    .slice()
    .sort((a, b) => a.menu_item_id.localeCompare(b.menu_item_id))
    .map((i) => `${i.menu_item_id}:${i.quantity}`)
    .join("|");

  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generates a SHA-256 audit hash chained with the previous event's hash (blockchain-style ledger).
 */
export function generateAuditBlockHash(previousHash: string | null, payload: unknown): string {
  const prev = previousHash || "GENESIS_BLOCK_0000000000000000";
  const content = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHash("sha256").update(`${prev}:${content}:${Date.now()}`).digest("hex");
}

/**
 * Generates a verifiable 8-character receipt HMAC stamp.
 */
export function generateReceiptHmacStamp(orderId: string, totalPaise: number): string {
  const data = `${orderId}:${totalPaise}`;
  return crypto.createHmac("sha256", CRYPTO_SECRET).update(data).digest("hex").slice(0, 8).toUpperCase();
}
