// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";

describe("BaileysConnectionManager", () => {
  let manager: BaileysConnectionManager;

  beforeEach(() => {
    manager = new BaileysConnectionManager();
  });

  it("returns disconnected status for unknown tenant", async () => {
    const status = await manager.getStatus("test-tenant");
    expect(status).toHaveProperty("connected");
    expect(status.connected).toBe(false);
  });

  it("returns null QR code for unknown tenant", async () => {
    const qrCode = await manager.getQRCode("test-tenant");
    expect(qrCode).toBeNull();
  });

  it("disconnect handles unknown tenant gracefully", async () => {
    await expect(manager.disconnect("unknown-tenant")).resolves.not.toThrow();
  });
});