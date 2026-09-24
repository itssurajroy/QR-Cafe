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



const { hasSessionMock } = vi.hoisted(() => ({
  hasSessionMock: vi.fn(),
}));

vi.mock("@/integrations/whatsapp/baileys/session-store", () => ({
  BaileysSessionStore: class {
    hasSession = hasSessionMock;
  },
}));

import { getSessionUser } from "@/lib/auth";

const ownerSession = {
  userId: "user-1",
  role: "owner",
  restaurantId: "rest-1",
};

const configuredSettings = {
  tenant_id: "rest-1",
  enabled: true,
  auto_send_bill: true,
  default_template: "bill_receipt",
  default_language: "en",
};

function mockConfiguredTenant() {
  mockMaybeSingle
    .mockResolvedValueOnce({ data: configuredSettings, error: null })
    .mockResolvedValueOnce({ data: { tenant_id: "rest-1" }, error: null });
}

function mockOrderAndRestaurant() {
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
  mockMaybeSingle.mockResolvedValueOnce({
    data: { name: "Test Café", gstin: "29ABCDE1234F1Z5" },
    error: null,
  });
}

function post(body: unknown) {
  return new NextRequest("http://localhost/api/whatsapp/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("WhatsApp Send API /api/whatsapp/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSessionMock.mockResolvedValue(true);
    const chainableEq = vi.fn(() => ({ eq: chainableEq, maybeSingle: mockMaybeSingle }));
    mockSelect.mockReturnValue({ eq: chainableEq });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockUpdate.mockReturnValue({ eq: chainableEq });
  });

  it("returns 401 when not authenticated", async () => {
    (getSessionUser as any).mockResolvedValue(null);

    const res = await POST(post({ order_id: "uuid", phone: "919876543210", template_name: "bill_receipt" }));

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

    const res = await POST(post({ order_id: "uuid", phone: "919876543210", template_name: "bill_receipt" }));

    expect(res.status).toBe(403);
  });

  it("returns 400 when WhatsApp settings not configured", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(
      post({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("WhatsApp not configured for this restaurant");
  });

  it("returns 404 when order not found", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(
      post({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    );

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Order not found");
  });

  it("queues WhatsApp template message asynchronously (async outbox pattern)", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    mockOrderAndRestaurant();
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    mockSingle.mockResolvedValueOnce({ data: { id: "msg-uuid", status: "pending" }, error: null });

    const res = await POST(
      post({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("messageId", "msg-uuid");
    expect(data).toHaveProperty("status", "pending");
  });

  it("returns existing message idempotently on duplicate call", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    mockOrderAndRestaurant();
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: "existing-msg-id", status: "pending" }, error: null });

    const res = await POST(
      post({ order_id: "123e4567-e89b-12d3-a456-426614174000", phone: "919876543210", template_name: "bill_receipt" }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("messageId", "existing-msg-id");
    expect(data).toHaveProperty("status", "pending");
    expect(data).toHaveProperty("idempotent", true);
  });

  it("still enforces bill idempotency when order_id present", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    mockOrderAndRestaurant();
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "existing-bill-id", status: "sent" },
      error: null,
    });

    const res = await POST(
      post({
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        phone: "919876543210",
        message_type: "bill_receipt",
      }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messageId).toBe("existing-bill-id");
    expect(data.idempotent).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("accepts request without order_id (test message)", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    mockSingle.mockResolvedValueOnce({ data: { id: "msg-test-uuid", status: "pending" }, error: null });

    const res = await POST(post({ phone: "919876543210" }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("messageId", "msg-test-uuid");
    expect(data).toHaveProperty("status", "pending");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "rest-1",
        order_id: null,
        message_type: "test",
        recipient_phone: "919876543210",
        status: "pending",
      }),
    );
  });

  it("400 on implausible phone", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();

    const res = await POST(post({ phone: "123" }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/phone/i);
  });

  it("400 when tenant has no linked session", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    hasSessionMock.mockResolvedValue(false);

    const res = await POST(post({ phone: "919876543210" }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/link whatsapp/i);
  });

  it("does not call baileysClient.sendTemplate (enqueue only)", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    mockConfiguredTenant();
    mockSingle.mockResolvedValueOnce({ data: { id: "msg-enqueue-uuid", status: "pending" }, error: null });

    const res = await POST(post({ phone: "919876543210" }));

    expect(res.status).toBe(200);
  });

  it("returns 422 for invalid input", async () => {
    (getSessionUser as any).mockResolvedValue(ownerSession);

    const res = await POST(post({ order_id: "not-a-uuid", phone: "123", template_name: "bill_receipt" }));

    expect(res.status).toBe(422);
  });
});
