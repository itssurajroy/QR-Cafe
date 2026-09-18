// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const chainableEq = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from "@/lib/auth";
import { GET } from "@/app/api/admin/crm/segments/route";

const customersFixture = [
  {
    id: "cust-1",
    name: "VIP Opted In",
    phone: "919876543210",
    total_spent_paise: 600000,
    visit_count: 10,
    last_visit_at: "2026-09-10T10:00:00Z",
    loyalty_points: 500,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cust-2",
    name: "VIP Not Opted In",
    phone: "919876543211",
    total_spent_paise: 700000,
    visit_count: 8,
    last_visit_at: "2026-09-11T10:00:00Z",
    loyalty_points: 300,
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "cust-3",
    name: "Regular Customer",
    phone: "919876543212",
    total_spent_paise: 100000,
    visit_count: 3,
    last_visit_at: "2026-09-12T10:00:00Z",
    loyalty_points: 100,
    created_at: "2026-06-01T00:00:00Z",
  },
];

describe("Segments API /api/admin/crm/segments", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // restaurant_customers chain: from().select().eq() → awaited terminal
    // whatsapp_opt_ins chain: from().select().eq().eq().in() → awaited terminal
    mockFrom.mockImplementation((table: string) => {
      if (table === "restaurant_customers") {
        return {
          select: vi.fn(() => ({ eq: mockEq })),
        };
      }
      if (table === "whatsapp_opt_ins") {
        return {
          select: vi.fn(() => ({ eq: chainableEq })),
        };
      }
      return {};
    });

    chainableEq.mockImplementation(() => ({ eq: chainableEq, in: mockIn }));
    mockEq.mockResolvedValue({ data: customersFixture, error: null });
    mockIn.mockResolvedValue({
      data: [{ phone: "919876543210", opt_in_type: "both" }],
      error: null,
    });

    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: "rest-1",
    });
  });

  it("returns 401 when not authenticated", async () => {
    (getSessionUser as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/admin/crm/segments", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when user has no restaurantId", async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: "user-1",
      role: "owner",
      restaurantId: null,
    });

    const req = new NextRequest("http://localhost/api/admin/crm/segments", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns counts for all 8 segments and opt-in-filtered reachable list for vip", async () => {
    const req = new NextRequest("http://localhost/api/admin/crm/segments?segment=vip", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.segment).toBe("vip");

    // Counts for every segment id present
    for (const id of ["all", "new", "returning", "vip", "inactive", "active", "high_spenders", "loyalty_members"]) {
      expect(data.counts).toHaveProperty(id);
    }
    expect(data.counts.all).toBe(3);
    expect(data.counts.vip).toBe(2);

    // Only the opted-in VIP is reachable; the non-opted-in VIP is excluded
    expect(data.reachable).toHaveLength(1);
    expect(data.reachable[0]).toEqual({ phone: "919876543210", opt_in_type: "both" });
  });

  it("falls back to segment=all for an invalid segment param (empty reachable)", async () => {
    const req = new NextRequest("http://localhost/api/admin/crm/segments?segment=invalid", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.segment).toBe("all");
    expect(data.counts.all).toBe(3);
    expect(data.reachable).toEqual([]);
    // segment=all never queries opt-ins
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("returns empty reachable when DB fetch fails with 500", async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: "DB down" } });

    const req = new NextRequest("http://localhost/api/admin/crm/segments?segment=vip", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("DB down");
  });
});
