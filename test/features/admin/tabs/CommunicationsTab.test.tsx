// @vitest-environment jsdom
// Copyright (c) 2026 QRslice. All rights reserved.
// NOTE: jest-dom is not installed (no setupFiles), so assertions use
// `.not.toBeNull()` instead of `toBeInTheDocument()` — same as SettingsTab.test.tsx.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CommunicationsTab } from "@/features/admin/tabs/CommunicationsTab";
import { canAccessTab } from "@/lib/role-permissions";
import { NAV_GROUPS } from "@/components/shell/AdminAppShell";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const mockProps = {
  flash: vi.fn(),
  userRole: "owner",
};

const mockMessages = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    order_id: "22222222-2222-4222-8222-222222222222",
    order_number: 1045,
    message_type: "bill_receipt",
    recipient_phone: "919876543210",
    status: "delivered",
    sent_at: "2026-09-18T10:00:00Z",
    created_at: "2026-09-18T10:00:00Z",
    latest_event: { event_type: "delivered", created_at: "2026-09-18T10:01:00Z" },
  },
];

function stubFetchOk(payload: unknown = {}) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => payload,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("CommunicationsTab", () => {
  it("renders communication history with order and delivery status", async () => {
    stubFetchOk({ messages: mockMessages, total: 1, page: 1, limit: 20 });
    render(<CommunicationsTab {...mockProps} />);
    await waitFor(() => screen.getByText("Communication History"));
    expect(screen.getByText("Order #1045")).not.toBeNull();
    // Scoped to the status badge <span> — the status <select> also has a "Delivered" option.
    expect(screen.getByText("Delivered", { selector: "span" })).not.toBeNull();
  });

  it("shows coming-soon empty state for non-WhatsApp channels without fake rows", async () => {
    const fetchMock = stubFetchOk({ messages: mockMessages, total: 1, page: 1, limit: 20 });
    render(<CommunicationsTab {...mockProps} />);
    await waitFor(() => screen.getByText("Communication History"));
    fireEvent.click(screen.getByText("Email"));
    expect(screen.getByText(/coming soon/i)).not.toBeNull();
    expect(screen.queryByText("Order #1045")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/communications"),
    );
  });

  it("resends a failed message via idempotent POST /api/whatsapp/send", async () => {
    const failed = [{ ...mockMessages[0], status: "failed" }];
    const fetchMock = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
      if (String(input).startsWith("/api/whatsapp/send")) {
        return { ok: true, json: async () => ({ messageId: failed[0].id, idempotent: true }) };
      }
      return { ok: true, json: async () => ({ messages: failed, total: 1, page: 1, limit: 20 }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<CommunicationsTab {...mockProps} />);
    await waitFor(() => screen.getByText("Communication History"));
    fireEvent.click(screen.getByText("Resend"));
    await waitFor(() => {
      const resendCall = fetchMock.mock.calls.find(
        (c) => String(c[0]) === "/api/whatsapp/send" && (c[1] as { method?: string } | undefined)?.method === "POST",
      );
      expect(resendCall).toBeDefined();
    });
    const resendCall = fetchMock.mock.calls.find(
      (c) => String(c[0]) === "/api/whatsapp/send",
    );
    const body = JSON.parse((resendCall?.[1] as { body?: string })?.body as string);
    expect(body.order_id).toBe(failed[0].order_id);
  });

  it("is reachable from the sidebar nav for owner and manager roles", () => {
    expect(canAccessTab("owner", "communications")).toBe(true);
    expect(canAccessTab("manager", "communications")).toBe(true);
    expect(canAccessTab("staff", "communications")).toBe(false);
    const navIds = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(navIds).toContain("communications");
  });

  it("hides the Resend button for roles without send permission (read-only)", async () => {
    stubFetchOk({ messages: mockMessages, total: 1, page: 1, limit: 20 });
    render(<CommunicationsTab flash={vi.fn()} userRole="staff" />);
    await waitFor(() => screen.getByText("Communication History"));
    await waitFor(() => screen.getByText("Order #1045"));
    expect(screen.queryByText("Resend")).toBeNull();
    // Owner view keeps the Resend action.
    cleanup();
    stubFetchOk({ messages: mockMessages, total: 1, page: 1, limit: 20 });
    render(<CommunicationsTab flash={vi.fn()} userRole="owner" />);
    await waitFor(() => screen.getByText("Resend"));
    expect(screen.getByText("Resend")).not.toBeNull();
  });
});
