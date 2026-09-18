// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";

const { mockMaybeSingle, mockRedirect } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mockMaybeSingle }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

import OrderAgainPage from "@/app/order-again/[statusToken]/page";

function params(token: string) {
  return { params: Promise.resolve({ statusToken: token }) };
}

describe("GET /order-again/[statusToken]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to the live order route for a valid token", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "order-1" },
      error: null,
    });

    await expect(OrderAgainPage(params("abc123"))).rejects.toThrow(
      "NEXT_REDIRECT:/order/abc123",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/order/abc123");
  });

  it("renders a friendly not-found state for an unknown token (no redirect loop)", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const element = await OrderAgainPage(params("nope-unknown"));
    const html = renderToString(element as React.ReactElement);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(html).toContain("Order not found");
  });
});
