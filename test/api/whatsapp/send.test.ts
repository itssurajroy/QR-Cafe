// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/whatsapp/send/route";
import { NextRequest } from "next/server";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/integrations/whatsapp/baileys/client", () => ({
  baileysClient: {
    sendTemplate: vi.fn(),
  },
}));

import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { baileysClient } from "@/integrations/whatsapp/baileys/client";

describe("WhatsApp Send API /api/whatsapp/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chainableEq = vi.fn(() => ({ eq: chainableEq, maybeSingle: mockMaybeSingle }));
    mockSelect.mockReturnValue({ eq: chainableEq });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockUpdate.mockReturnValue({ eq: chainableEq });
  });

  it("returns 401 when not authenticated", async () => {
    (getSessionUser as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "uuid", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not owner or super_admin", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "staff",
      restaurantId: "rest-1",
    });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "uuid", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("returns 400 when WhatsApp settings not configured", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });

    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("WhatsApp not configured for this restaurant");
  });

  it("returns 404 when order not found", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1", enabled: true, auto_send_bill: true, default_template: "bill_receipt", default_language: "en" }, error: null })
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1" }, error: null });

    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Order not found");
  });

  it("queues WhatsApp template message asynchronously (async outbox pattern)", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1", enabled: true, auto_send_bill: true, default_template: "bill_receipt", default_language: "en" }, error: null })
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1" }, error: null });

    const mockOrder = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      restaurant_id: "rest-1",
      order_number: "ORD-123",
      table_label: "T5",
      total_paise: 50000,
      payment_method: "cash",
      payment_status: "paid",
      status_token: "token123",
    };
    mockMaybeSingle.mockResolvedValueOnce({ data: mockOrder, error: null });

    mockMaybeSingle.mockResolvedValueOnce({ data: { name: "Test Café", gstin: "29ABCDE1234F1Z5" }, error: null });

    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const mockOutboundMsg = { id: "msg-uuid", status: "pending" };
    mockSingle.mockResolvedValueOnce({ data: mockOutboundMsg, error: null });

    mockInsert.mockReturnValueOnce({ select: () => ({ single: mockSingle }) });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("messageId", "msg-uuid");
    expect(data).toHaveProperty("status", "pending");
    expect(baileysClient.sendTemplate).not.toHaveBeenCalled();
  });

  it("returns existing message idempotently on duplicate call", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1", enabled: true, auto_send_bill: true, default_template: "bill_receipt", default_language: "en" }, error: null })
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1" }, error: null });

    const mockOrder = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      restaurant_id: "rest-1",
      order_number: "ORD-123",
      table_label: "T5",
      total_paise: 50000,
      payment_method: "cash",
      payment_status: "paid",
      status_token: "token123",
    };
    mockMaybeSingle.mockResolvedValueOnce({ data: mockOrder, error: null });

    mockMaybeSingle.mockResolvedValueOnce({ data: { name: "Test Café", gstin: "29ABCDE1234F1Z5" }, error: null });

    mockMaybeSingle.mockResolvedValueOnce({ data: { id: "existing-msg-id", status: "pending" }, error: null });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("messageId", "existing-msg-id");
    expect(data).toHaveProperty("status", "pending");
    expect(data).toHaveProperty("idempotent", true);
    expect(baileysClient.sendTemplate).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid input", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "not-a-uuid", phone: "123", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
  });
});