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
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  })),
}));

interface MockSocket {
  user?: { id: string };
  authState: { creds: unknown; keys: unknown };
  ev: {
    on: (event: string, handler: (data: unknown) => void) => void;
    off: (event: string, handler: (data: unknown) => void) => void;
  };
  end: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  ws: { close: ReturnType<typeof vi.fn> };
  emit: (event: string, data: unknown) => void;
}

const mockBaileys = vi.hoisted(() => {
  type Handler = (data: unknown) => void;

  const sockets: Array<{
    user?: { id: string };
    authState: { creds: unknown; keys: unknown };
    ev: {
      on: (event: string, handler: Handler) => void;
      off: (event: string, handler: Handler) => void;
    };
    end: { (...args: unknown[]): unknown };
    logout: { (): Promise<void> };
    ws: { close: () => void };
    emit: (event: string, data: unknown) => void;
  }> = [];

  const makeWASocket = vi.fn(() => {
    const handlers = new Map<string, Set<Handler>>();
    const socket = {
      authState: { creds: {}, keys: {} },
      ev: {
        on: (event: string, handler: Handler) => {
          if (!handlers.has(event)) handlers.set(event, new Set());
          handlers.get(event)!.add(handler);
        },
        off: (event: string, handler: Handler) => {
          handlers.get(event)?.delete(handler);
        },
      },
      end: vi.fn(),
      logout: vi.fn(async () => {}),
      ws: { close: vi.fn() },
      emit: (event: string, data: unknown) => {
        for (const handler of handlers.get(event) ?? []) handler(data);
      },
    };
    sockets.push(socket);
    return socket as unknown as ReturnType<typeof import("@whiskeysockets/baileys").default>;
  });

  return { makeWASocket, sockets };
});

vi.mock("@whiskeysockets/baileys", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@whiskeysockets/baileys")>();
  return {
    ...actual,
    default: mockBaileys.makeWASocket,
  };
});

import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";
import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";

function lastSocket(): MockSocket {
  return mockBaileys.sockets[mockBaileys.sockets.length - 1] as unknown as MockSocket;
}

describe("BaileysConnectionManager", () => {
  let manager: BaileysConnectionManager;

  beforeEach(() => {
    manager = new BaileysConnectionManager();
    mockBaileys.makeWASocket.mockClear();
    mockBaileys.sockets.length = 0;
  });

  afterEach(async () => {
    vi.useRealTimers();
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

  it("waitForOpen resolves when connection opens", async () => {
    await manager.connect("test-tenant");
    const socket = lastSocket();
    const promise = manager.waitForOpen("test-tenant", 1000);
    socket.emit("connection.update", { connection: "open" });
    await expect(promise).resolves.toBeUndefined();
  });

  it("waitForOpen rejects on timeout", async () => {
    await manager.connect("test-tenant");
    await expect(manager.waitForOpen("test-tenant", 50)).rejects.toThrow(/timeout/i);
  });

  it("release closes socket without logout and keeps session", async () => {
    await manager.connect("test-tenant");
    const socket = lastSocket();
    const clearSpy = vi.spyOn(BaileysSessionStore.prototype, "clearAuthState");

    await manager.release("test-tenant");

    expect(socket.logout).not.toHaveBeenCalled();
    expect(socket.end).toHaveBeenCalledWith(undefined);
    expect(socket.ws.close).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(manager.getSocket("test-tenant")).toBeUndefined();

    clearSpy.mockRestore();
  });

  it("disconnect logs out and wipes session", async () => {
    await manager.connect("test-tenant");
    const socket = lastSocket();
    const clearSpy = vi.spyOn(BaileysSessionStore.prototype, "clearAuthState");

    await manager.disconnect("test-tenant");

    expect(socket.logout).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledWith("test-tenant");

    clearSpy.mockRestore();
  });

  it("connect with autoReconnect:false does not schedule reconnect on close", async () => {
    vi.useFakeTimers();
    await manager.connect("test-tenant", { autoReconnect: false });
    expect(mockBaileys.makeWASocket).toHaveBeenCalledTimes(1);

    const socket = lastSocket();
    socket.emit("connection.update", { connection: "close" });
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockBaileys.makeWASocket).toHaveBeenCalledTimes(1);
  });

  it("waitForOpen rejects promptly when released", async () => {
    await manager.connect("test-tenant");
    const promise = manager.waitForOpen("test-tenant", 60_000);
    const assertion = expect(promise).rejects.toThrow(/released/i);
    await manager.release("test-tenant");
    await assertion;
  });

  it("waitForOpen rejects promptly when disconnected", async () => {
    await manager.connect("test-tenant");
    const promise = manager.waitForOpen("test-tenant", 60_000);
    const assertion = expect(promise).rejects.toThrow(/disconnect/i);
    await manager.disconnect("test-tenant");
    await assertion;
  });

  it("connect applies autoReconnect:false on existing connection", async () => {
    vi.useFakeTimers();
    await manager.connect("test-tenant");
    expect(mockBaileys.makeWASocket).toHaveBeenCalledTimes(1);

    await manager.connect("test-tenant", { autoReconnect: false });
    expect(mockBaileys.makeWASocket).toHaveBeenCalledTimes(1);

    const socket = lastSocket();
    socket.emit("connection.update", { connection: "close" });
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockBaileys.makeWASocket).toHaveBeenCalledTimes(1);
  });

  it("waitForOpen resolves via manager when socket reopens after reconnect", async () => {
    vi.useFakeTimers();
    await manager.connect("test-tenant");
    const promise = manager.waitForOpen("test-tenant", 60_000);

    lastSocket().emit("connection.update", { connection: "close" });
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockBaileys.makeWASocket).toHaveBeenCalledTimes(2);

    lastSocket().emit("connection.update", { connection: "open" });
    await expect(promise).resolves.toBeUndefined();
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
