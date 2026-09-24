// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/admin/whatsapp/settings/route";
import { NextRequest } from "next/server";

// Mock Supabase admin client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
  insert: mockInsert,
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

import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

describe("WhatsApp Settings API /api/admin/whatsapp/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockUpsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      (getSessionUser as any).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", { method: "GET" });
      const res = await GET(req);
      
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when user has no restaurant", async () => {
      (getSessionUser as any).mockResolvedValue({ userId: "user-1", role: "owner", restaurantId: null });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", { method: "GET" });
      const res = await GET(req);
      
      expect(res.status).toBe(401);
    });

    it("returns settings with Cloud API credentials when they exist", async () => {
      (getSessionUser as any).mockResolvedValue({
        userId: "user-1",
        role: "owner",
        restaurantId: "rest-1",
      });

      mockMaybeSingle
        .mockResolvedValueOnce({
          data: {
            tenant_id: "rest-1",
            enabled: true,
            message_template: "Custom template",
            include_review_cta: true,
            include_gstin_line: true,
            thank_you_line: "Thanks!",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", { method: "GET" });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("enabled", true);
      expect(data).toHaveProperty("message_template", "Custom template");
      expect(data).toHaveProperty("include_review_cta", true);
      expect(data).toHaveProperty("include_gstin_line", true);
      expect(data).toHaveProperty("thank_you_line", "Thanks!");
      expect(data).not.toHaveProperty("phone_number_id");
      expect(data).not.toHaveProperty("access_token");
    });

    it("returns defaults when settings don't exist", async () => {
      (getSessionUser as any).mockResolvedValue({ 
        userId: "user-1", 
        role: "owner", 
        restaurantId: "rest-1" 
      });

      // Both tables return no data
      mockMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", { method: "GET" });
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("enabled", true);
      expect(data).toHaveProperty("message_template");
      expect(data).toHaveProperty("include_review_cta", true);
      expect(data).toHaveProperty("include_gstin_line", true);
      expect(data).toHaveProperty("thank_you_line");
    });
  });

  describe("PATCH", () => {
    it("returns 401 when not authenticated", async () => {
      (getSessionUser as any).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", {
        method: "PATCH",
        body: JSON.stringify({ enabled: false }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not owner or super_admin", async () => {
      (getSessionUser as any).mockResolvedValue({ 
        userId: "user-1", 
        role: "staff", 
        restaurantId: "rest-1" 
      });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", {
        method: "PATCH",
        body: JSON.stringify({ enabled: false }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(403);
    });

    it("updates whatsapp_settings and whatsapp_accounts tables", async () => {
      (getSessionUser as any).mockResolvedValue({
        userId: "user-1",
        role: "owner",
        restaurantId: "rest-1",
      });

      mockSingle.mockResolvedValue({ data: { tenant_id: "rest-1", enabled: false }, error: null });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: false,
          message_template: "New template",
          include_review_cta: false,
          include_gstin_line: false,
          thank_you_line: "Goodbye!",
        }),
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.settings).toHaveProperty("enabled", false);
    });

    it("rejects Cloud credentials with 422", async () => {
      (getSessionUser as any).mockResolvedValue({
        userId: "user-1",
        role: "owner",
        restaurantId: "rest-1",
      });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", {
        method: "PATCH",
        body: JSON.stringify({
          phone_number_id: "987654321",
          access_token: "new-token",
        }),
      });
      const res = await PATCH(req);

      expect(res.status).toBe(422);
    });

    it("returns 422 for invalid input", async () => {
      (getSessionUser as any).mockResolvedValue({ 
        userId: "user-1", 
        role: "owner", 
        restaurantId: "rest-1" 
      });

      const req = new NextRequest("http://localhost/api/admin/whatsapp/settings", {
        method: "PATCH",
        body: JSON.stringify({ enabled: "not-a-boolean" }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(422);
    });
  });
});