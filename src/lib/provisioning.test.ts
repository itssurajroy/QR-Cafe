// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  ownerEmail: z.string().email(),
});

describe("provisioning validation", () => {
  it("rejects bad slug", () => {
    expect(schema.safeParse({ name: "AB", slug: "Bad Slug!", ownerEmail: "o@x.com" }).success).toBe(false);
  });
  it("accepts valid input", () => {
    expect(schema.safeParse({ name: "Chai Point", slug: "chai-point", ownerEmail: "o@x.com" }).success).toBe(true);
  });
});
