// @vitest-environment jsdom
// Copyright (c) 2026 QRslice. All rights reserved.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SettingsTab } from "@/features/admin/tabs/SettingsTab";

// Supabase browser client requires env vars and is only used for UPI-QR
// image upload — irrelevant to the WhatsApp section under test.
vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const mockProps = {
  restaurant: { id: "00000000-0000-4000-8000-000000000001", name: "Test Cafe", phone: "919876543210" },
  settingsCafeName: "Test Cafe",
  setSettingsCafeName: vi.fn(),
  settingsTaxRate: 5,
  setSettingsTaxRate: vi.fn(),
  settingsUpiId: "testcafe@upi",
  setSettingsUpiId: vi.fn(),
  settingsUpiQrUrl: "",
  setSettingsUpiQrUrl: vi.fn(),
  settingsPhone: "919876543210",
  setSettingsPhone: vi.fn(),
  settingsAddress: "Test Address",
  setSettingsAddress: vi.fn(),
  flash: vi.fn(),
};

function stubFetchOk(payload: unknown = {}) {
  const fetchMock = vi.fn(
    async (input: unknown, init?: { method?: string; body?: string }) => ({
      ok: true,
      json: async () => payload,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function openWhatsAppSection() {
  fireEvent.click(screen.getByText("WhatsApp Receipts"));
  await waitFor(() => screen.getByText("WhatsApp Connection"));
}

describe("SettingsTab WhatsApp section", () => {
  it("renders Baileys link panel and test-send button", async () => {
    const fetchMock = stubFetchOk({});
    render(<SettingsTab {...mockProps} />);
    await openWhatsAppSection();
    expect(screen.getByText("WhatsApp Connection")).not.toBeNull();
    expect(screen.getByText(/Send Test WhatsApp/)).not.toBeNull();
    // Component fetches admin settings and whatsapp status on mount
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/api/whatsapp/"))).toBe(true);
  });

  it("saves behavioral fields via the admin settings endpoint", async () => {
    const fetchMock = stubFetchOk({});
    render(<SettingsTab {...mockProps} />);
    await openWhatsAppSection();

    fireEvent.click(screen.getByText(/Save WhatsApp Template/));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === "PATCH");
      expect(patchCall).toBeDefined();
    });
    const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === "PATCH");
    expect(patchCall?.[0]).toBe("/api/admin/whatsapp/settings");
    const body = JSON.parse(patchCall?.[1]?.body as string);
    expect(body).not.toHaveProperty("phone_number_id");
    expect(body).not.toHaveProperty("access_token");
  });

  it("sends a test message via POST /api/whatsapp/send", async () => {
    const fetchMock = stubFetchOk({ linked: true, connected: true });
    render(<SettingsTab {...mockProps} />);
    await openWhatsAppSection();

    fireEvent.click(screen.getByText(/Send Test WhatsApp/));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (c) => c[0] === "/api/whatsapp/send" && c[1]?.method === "POST",
      );
      expect(postCall).toBeDefined();
    });
  });
});
