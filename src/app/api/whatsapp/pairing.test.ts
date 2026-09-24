// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { hasSessionMock, getStatusMock, getQRCodeMock, connectMock, disconnectMock } = vi.hoisted(() => ({
  hasSessionMock: vi.fn(),
  getStatusMock: vi.fn(),
  getQRCodeMock: vi.fn(),
  connectMock: vi.fn(),
  disconnectMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/integrations/whatsapp/baileys/session-store", () => ({
  BaileysSessionStore: class {
    hasSession = hasSessionMock;
  },
}));

vi.mock("@/integrations/whatsapp/baileys/connection-manager", () => ({
  BaileysConnectionManager: class {
    connect = connectMock;
    getStatus = getStatusMock;
    getQRCode = getQRCodeMock;
    disconnect = disconnectMock;
  },
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,abc") },
  toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
}));

import { getSessionUser } from "@/lib/auth";

describe("WhatsApp pairing APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSessionMock.mockResolvedValue(false);
    getStatusMock.mockResolvedValue({ connected: false });
    getQRCodeMock.mockResolvedValue("test-qr-string");
    connectMock.mockResolvedValue(undefined);
    disconnectMock.mockResolvedValue(undefined);
  });

  describe("GET /api/whatsapp/qr", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce(null);
      const { GET } = await import("./qr/route");
      const req = new NextRequest("http://localhost/api/whatsapp/qr");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toMatch(/unauthorized/i);
    });

    it("returns 403 when role is not owner or super_admin", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({
        userId: "u1",
        role: "staff",
        restaurantId: "r1",
      } as any);
      const { GET } = await import("./qr/route");
      const req = new NextRequest("http://localhost/api/whatsapp/qr");
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it("returns QR data URL when manager emits qr", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({
        userId: "u1",
        role: "owner",
        restaurantId: "r1",
      } as any);
      const { GET } = await import("./qr/route");
      const req = new NextRequest("http://localhost/api/whatsapp/qr");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.qr).toMatch(/^data:image\/png;base64,/);
    });

    it("returns connected when already connected", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({
        userId: "u1",
        role: "owner",
        restaurantId: "r1",
      } as any);
      getStatusMock.mockResolvedValueOnce({ connected: true, phoneNumber: "919999999999" } as any);
      const { GET } = await import("./qr/route");
      const req = new NextRequest("http://localhost/api/whatsapp/qr");
      const res = await GET(req);
      const body = await res.json();
      expect(body.connected).toBe(true);
    });
  });

  describe("GET /api/whatsapp/status", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce(null);
      const { GET } = await import("./status/route");
      const req = new NextRequest("http://localhost/api/whatsapp/status");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns linked status from hasSession", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({
        userId: "u1",
        role: "owner",
        restaurantId: "r1",
      } as any);
      hasSessionMock.mockResolvedValueOnce(true);
      const { GET } = await import("./status/route");
      const req = new NextRequest("http://localhost/api/whatsapp/status");
      const res = await GET(req);
      const body = await res.json();
      expect(body.linked).toBe(true);
      expect(body).toHaveProperty("connected");
    });

    it("returns connected/phone/lastSeen from getStatus", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({
        userId: "u1",
        role: "owner",
        restaurantId: "r1",
      } as any);
      getStatusMock.mockResolvedValueOnce({
        connected: true,
        phoneNumber: "919876543210",
        lastSeen: "2026-09-23T00:00:00.000Z",
      } as any);
      const { GET } = await import("./status/route");
      const req = new NextRequest("http://localhost/api/whatsapp/status");
      const res = await GET(req);
      const body = await res.json();
      expect(body.phoneNumber).toBe("919876543210");
      expect(body.lastSeenAt).toBeDefined();
    });
  });

  describe("POST /api/whatsapp/disconnect", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce(null);
      const { POST } = await import("./disconnect/route");
      const req = new NextRequest("http://localhost/api/whatsapp/disconnect", { method: "POST" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("clears WhatsApp session and returns ok", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({
        userId: "u1",
        role: "owner",
        restaurantId: "r1",
      } as any);
      const { POST } = await import("./disconnect/route");
      const req = new NextRequest("http://localhost/api/whatsapp/disconnect", { method: "POST" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(disconnectMock).toHaveBeenCalledWith("r1");
    });
  });
});
