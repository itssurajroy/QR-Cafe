// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/whatsapp/webhook/route";
import { NextRequest } from "next/server";

const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockNot = vi.fn();

const selectResult = { 
  eq: mockEq, 
  not: mockNot 
};

const mockFrom = vi.fn(() => ({
  select: vi.fn(() => selectResult),
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

describe("WhatsApp Webhook API /api/whatsapp/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNot.mockResolvedValue({ data: [], error: null });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
  });

  describe("GET - Webhook Verification", () => {
    it("returns 400 when missing required parameters", async () => {
      const req = new NextRequest("http://localhost/api/whatsapp/webhook");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Missing required parameters");
    });

    it("returns 400 when mode is not subscribe", async () => {
      const req = new NextRequest("http://localhost/api/whatsapp/webhook?hub.mode=unsubscribe&hub.verify_token=test_token&hub.challenge=12345");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid mode");
    });

    it("returns 403 when verify_token is invalid", async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const req = new NextRequest("http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid_token&hub.challenge=12345");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Invalid verify token");
    });

    it("returns challenge when verify_token is valid", async () => {
      mockMaybeSingle.mockResolvedValueOnce({ 
        data: { verify_token: "valid_token" }, 
        error: null 
      });

      const req = new NextRequest("http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=valid_token&hub.challenge=12345");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("12345");
      expect(res.headers.get("Content-Type")).toBe("text/plain");
    });
  });

  describe("POST - Status Updates", () => {
    const validPayload = {
      entry: [{
        changes: [{
          field: "messages",
          value: {
            statuses: [{
              id: "msg-123",
              status: "delivered",
              timestamp: "1699999999",
            }],
          },
        }],
      }],
    };

    it("returns 401 when missing signature", async () => {
      // No signature provided, route returns early before DB query
      // Uses default mock from beforeEach (empty data)

      const req = new NextRequest("http://localhost/api/whatsapp/webhook", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Missing signature");
    });

    it("returns 401 when signature is invalid", async () => {
      mockNot.mockResolvedValueOnce({ 
        data: [{ tenant_id: "rest-1", webhook_secret: "secret123" }], 
        error: null 
      });

      // Use a signature with correct length (sha256= + 64 hex chars) but wrong value
      const invalidSignature = "sha256=" + "0".repeat(64);
      
      const req = new NextRequest("http://localhost/api/whatsapp/webhook", {
        method: "POST",
        headers: { "x-hub-signature-256": invalidSignature },
        body: JSON.stringify(validPayload),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid signature");
    });

    it("processes delivered status update", async () => {
      mockNot.mockResolvedValueOnce({ 
        data: [{ tenant_id: "rest-1", webhook_secret: "secret123" }], 
        error: null 
      });

      mockUpdate.mockReturnValueOnce({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      // We need to calculate the correct HMAC for the test
      const crypto = await import("crypto");
      const body = JSON.stringify(validPayload);
      const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", "secret123")
        .update(body)
        .digest("hex");

      const req = new NextRequest("http://localhost/api/whatsapp/webhook", {
        method: "POST",
        headers: { "x-hub-signature-256": expectedSignature },
        body: JSON.stringify(validPayload),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("processes multiple status updates in one payload", async () => {
      const multiPayload = {
        entry: [{
          changes: [{
            field: "messages",
            value: {
              statuses: [
                { id: "msg-1", status: "sent", timestamp: "1699999999" },
                { id: "msg-2", status: "delivered", timestamp: "1699999999" },
                { id: "msg-3", status: "read", timestamp: "1699999999" },
                { id: "msg-4", status: "failed", timestamp: "1699999999", errors: [{ code: 100, message: "Failed" }] },
              ],
            },
          }],
        }],
      };

      mockNot.mockResolvedValueOnce({ 
        data: [{ tenant_id: "rest-1", webhook_secret: "secret123" }], 
        error: null 
      });

      mockUpdate.mockReturnValueOnce({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      mockInsert.mockResolvedValue({ error: null });

      const crypto = await import("crypto");
      const body = JSON.stringify(multiPayload);
      const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", "secret123")
        .update(body)
        .digest("hex");

      const req = new NextRequest("http://localhost/api/whatsapp/webhook", {
        method: "POST",
        headers: { "x-hub-signature-256": expectedSignature },
        body: JSON.stringify(multiPayload),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("returns 400 for invalid JSON", async () => {
      mockNot.mockResolvedValueOnce({ 
        data: [{ tenant_id: "rest-1", webhook_secret: "secret123" }], 
        error: null 
      });

      const crypto = await import("crypto");
      const body = "invalid json";
      const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", "secret123")
        .update(body)
        .digest("hex");

      const req = new NextRequest("http://localhost/api/whatsapp/webhook", {
        method: "POST",
        headers: { "x-hub-signature-256": expectedSignature },
        body,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON");
    });
  });
});