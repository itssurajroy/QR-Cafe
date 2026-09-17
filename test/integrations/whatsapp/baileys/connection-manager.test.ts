// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  })),
}));

import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";
import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";

describe("BaileysConnectionManager", () => {
  let manager: BaileysConnectionManager;

  beforeEach(() => {
    manager = new BaileysConnectionManager();
  });

  afterEach(async () => {
    // Clean up any connections
    const status = await manager.getStatus("test-tenant");
    if (status.connected) {
      await manager.disconnect("test-tenant");
    }
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

  it("throws on invalid tenantId for getStatus", async () => {
    await expect(manager.getStatus("")).rejects.toThrow("Invalid tenantId");
    await expect(manager.getStatus("   ")).rejects.toThrow("Invalid tenantId");
  });

  it("throws on invalid tenantId for getQRCode", async () => {
    await expect(manager.getQRCode("")).rejects.toThrow("Invalid tenantId");
    await expect(manager.getQRCode("   ")).rejects.toThrow("Invalid tenantId");
  });

  it("throws on invalid tenantId for connect", async () => {
    await expect(manager.connect("")).rejects.toThrow("Invalid tenantId");
    await expect(manager.connect("   ")).rejects.toThrow("Invalid tenantId");
  });

  it("throws on invalid tenantId for disconnect", async () => {
    await expect(manager.disconnect("")).rejects.toThrow("Invalid tenantId");
    await expect(manager.disconnect("   ")).rejects.toThrow("Invalid tenantId");
  });

  it("getSocket returns undefined for unknown tenant", () => {
    const socket = manager.getSocket("unknown-tenant");
    expect(socket).toBeUndefined();
  });

  it("getSocket throws on invalid tenantId", () => {
    expect(() => manager.getSocket("")).toThrow("Invalid tenantId");
    expect(() => manager.getSocket("   ")).toThrow("Invalid tenantId");
  });
});

describe("BaileysSessionStore", () => {
  let store: BaileysSessionStore;

  beforeEach(() => {
    store = new BaileysSessionStore();
  });

  it("returns null for non-existent session", async () => {
    const state = await store.getAuthState("non-existent-tenant");
    expect(state).toBeNull();
  });

  it("throws on invalid tenantId for getAuthState", async () => {
    await expect(store.getAuthState("")).rejects.toThrow("Invalid tenantId");
    await expect(store.getAuthState("   ")).rejects.toThrow("Invalid tenantId");
  });

  it("throws on invalid tenantId for saveAuthState", async () => {
    const mockState = { creds: {}, keys: {} } as any;
    await expect(store.saveAuthState("", mockState)).rejects.toThrow("Invalid tenantId");
  });

  it("throws on invalid tenantId for clearAuthState", async () => {
    await expect(store.clearAuthState("")).rejects.toThrow("Invalid tenantId");
  });

  it("throws on unsupported keyId for rotateKey", async () => {
    await expect(store.rotateKey("tenant", "unsupported")).rejects.toThrow("Unsupported encryption key ID");
  });
});
