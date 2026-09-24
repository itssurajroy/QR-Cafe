// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  inboundInsert: vi.fn(),
  ticketUpsert: vi.fn(),
  messageInsert: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "whatsapp_inbound_messages") return { insert: mocks.inboundInsert };
      if (table === "whatsapp_tickets") return { upsert: mocks.ticketUpsert };
      if (table === "whatsapp_messages") return { insert: mocks.messageInsert };
      return { insert: vi.fn(), upsert: vi.fn() };
    }),
  })),
}));

import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";

function makeMsg(overrides: Partial<{ id: string; jid: string; body: string; fromMe: boolean; pushName: string }> = {}) {
  return {
    key: {
      id: overrides.id ?? "m1",
      remoteJid: overrides.jid ?? "919876543210@s.whatsapp.net",
      fromMe: overrides.fromMe ?? false,
    },
    pushName: overrides.pushName ?? "Alice",
    message: { conversation: overrides.body ?? "MENU" },
  } as unknown;
}

describe("handleMessagesUpsert inbound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ticketUpsert.mockResolvedValue({ error: null });
    mocks.messageInsert.mockResolvedValue({ data: null, error: null });
  });

  it("inbound MENU enqueues keyword reply", async () => {
    mocks.inboundInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: "uuid-1" }], error: null }),
    } as never);

    const manager = new BaileysConnectionManager();
    await (manager as unknown as { handleMessagesUpsert: (t: string, m: unknown[]) => Promise<void> }).handleMessagesUpsert(
      "11111111-1111-1111-1111-111111111111",
      [makeMsg({ body: "MENU" })],
    );

    expect(mocks.inboundInsert).toHaveBeenCalled();
    const inboundArg = mocks.inboundInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(inboundArg).toMatchObject({ inbound_id: "m1", body: "MENU" });

    expect(mocks.ticketUpsert).toHaveBeenCalled();
    expect(mocks.messageInsert).toHaveBeenCalledWith(
      expect.objectContaining({ message_type: "keyword_reply", status: "pending" }),
    );
  });

  it("dedupe second same id no-op", async () => {
    mocks.inboundInsert.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: [{ id: "uuid-1" }], error: null }),
    } as never);

    const manager = new BaileysConnectionManager();
    const msg = makeMsg({ id: "dup1", body: "MENU" });

    await (manager as unknown as { handleMessagesUpsert: (t: string, m: unknown[]) => Promise<void> }).handleMessagesUpsert(
      "11111111-1111-1111-1111-111111111111",
      [msg],
    );
    expect(mocks.messageInsert).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    mocks.ticketUpsert.mockResolvedValue({ error: null });
    mocks.messageInsert.mockResolvedValue({ data: null, error: null });
    mocks.inboundInsert.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate" } }),
    } as never);

    await (manager as unknown as { handleMessagesUpsert: (t: string, m: unknown[]) => Promise<void> }).handleMessagesUpsert(
      "11111111-1111-1111-1111-111111111111",
      [msg],
    );

    expect(mocks.ticketUpsert).not.toHaveBeenCalled();
    expect(mocks.messageInsert).not.toHaveBeenCalled();
  });

  it("ignores fromMe and empty body", async () => {
    const manager = new BaileysConnectionManager();
    await (manager as unknown as { handleMessagesUpsert: (t: string, m: unknown[]) => Promise<void> }).handleMessagesUpsert(
      "11111111-1111-1111-1111-111111111111",
      [
        makeMsg({ fromMe: true, body: "MENU" }),
        { key: { id: "m2", remoteJid: "9199@s.whatsapp.net", fromMe: false }, message: { conversation: "   " }, pushName: "Bob" } as unknown,
      ],
    );
    expect(mocks.inboundInsert).not.toHaveBeenCalled();
  });
});
