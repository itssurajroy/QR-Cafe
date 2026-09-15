// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, API_KEY_PREFIX } from "./api-keys";

describe("generateApiKey", () => {
  it("starts with the live prefix", () => {
    expect(generateApiKey().key.startsWith(API_KEY_PREFIX)).toBe(true);
  });
  it("generates unique keys", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });
  it("hash is deterministic sha256 hex", () => {
    const { key, hash } = generateApiKey();
    expect(hash).toBe(hashApiKey(key));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
