// Copyright (c) 2026 QRslice. All rights reserved.
// Server-only helpers for platform API keys. The raw secret is shown once
// at creation; only its sha256 hash is stored.
import { randomBytes, createHash } from "node:crypto";

export const API_KEY_PREFIX = "qrs_live_";

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const secret = randomBytes(24).toString("hex");
  const key = `${API_KEY_PREFIX}${secret}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, 12) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
