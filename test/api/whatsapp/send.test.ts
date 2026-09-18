// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/whatsapp/send/route";
import { NextRequest } from "next/server";

// Mock Supabase admin client
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

// Mock getSessionUser
vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

// Mock BaileysClient
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
    // Support chained .eq().eq().maybeSingle()
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

    // Mock whatsapp_settings - no settings found
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // whatsapp_settings
      .mockResolvedValueOnce({ data: null, error: null }); // whatsapp_accounts

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

    // Mock whatsapp_settings - enabled
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1", enabled: true, auto_send_bill: true, default_template: "bill_receipt", default_language: "en" }, error: null })
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1" }, error: null }); // whatsapp_accounts

    // Mock order - not found
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

  it("sends WhatsApp template message successfully via BaileysClient", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });

    // Mock whatsapp_settings
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1", enabled: true, auto_send_bill: true, default_template: "bill_receipt", default_language: "en" }, error: null })
      .mockResolvedValueOnce({ data: { tenant_id: "rest-1" }, error: null }); // whatsapp_accounts

    // Mock order
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

    // Mock restaurant
    mockMaybeSingle.mockResolvedValueOnce({ data: { name: "Test Café", gstin: "29ABCDE1234F1Z5" }, error: null });

    // Mock whatsapp_messages insert
    const mockOutboundMsg = { id: "msg-uuid", restaurant_id: "rest-1", order_id: "123e4567-e89b-12d3-a456-426614174000", status: "pending" };
    mockSingle.mockResolvedValueOnce({ data: mockOutboundMsg, error: null });

    // Mock BaileysClient.sendTemplate success
    (baileysClient.sendTemplate as any).mockResolvedValue({ success: true, messageId: "baileys-msg-id" });

    // Mock whatsapp_messages update
    mockEq.mockReturnValue({ data: null, error: null });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("messageId", "baileys-msg-id");
    expect(baileysClient.sendTemplate).toHaveBeenCalledWith(
      "rest-1",
      "919876543210",
      expect.objectContaining({
        name: "bill_receipt",
        language: "en",
      })
    );
  });

  it("returns 500 when BaileysClient.sendTemplate fails", async () => {
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

    const mockOutboundMsg = { id: "msg-uuid", restaurant_id: "rest-1", order_id: "123e4567-e89b-12d3-a456-426614174000", status: "pending" };
    mockSingle.mockResolvedValueOnce({ data: mockOutboundMsg, error: null });

    // Mock BaileysClient.sendTemplate failure
    (baileysClient.sendTemplate as any).mockResolvedValue({ success: false, error: "Not connected" });

    mockEq.mockReturnValue({ data: null, error: null });

    const req = new NextRequest("http://localhost/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Not connected");
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