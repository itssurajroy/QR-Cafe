// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { ensureIdempotencyKey } from "./offline-queue";

describe("ensureIdempotencyKey (A18)", () => {
  it("reuses a valid UUID idempotency_key on payload", () => {
    const uuid = "123e4567-e89b-42d3-a456-426614174000";
    const { payload, idempotencyKey } = ensureIdempotencyKey({
      items: [],
      idempotency_key: uuid,
    });
    expect(idempotencyKey).toBe(uuid);
    expect((payload as { idempotency_key: string }).idempotency_key).toBe(uuid);
  });

  it("injects a UUID when payload has no idempotency_key", () => {
    const { payload, idempotencyKey } = ensureIdempotencyKey({ items: [1] });
    expect(idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect((payload as { idempotency_key: string }).idempotency_key).toBe(idempotencyKey);
  });

  it("replaces a non-UUID idempotency_key with a fresh UUID", () => {
    const { payload, idempotencyKey } = ensureIdempotencyKey({
      idempotency_key: "not-a-uuid",
    });
    expect(idempotencyKey).not.toBe("not-a-uuid");
    expect(idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect((payload as { idempotency_key: string }).idempotency_key).toBe(idempotencyKey);
  });

  it("returns payload unchanged for non-object input", () => {
    const { payload, idempotencyKey } = ensureIdempotencyKey(null);
    expect(payload).toBeNull();
    expect(idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
