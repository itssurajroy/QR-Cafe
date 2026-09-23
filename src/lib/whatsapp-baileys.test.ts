// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { initAuthCreds } from "@whiskeysockets/baileys/lib/Utils/auth-utils";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({ from: mockFrom }),
}));

import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";

describe("BaileysSessionStore BufferJSON round-trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_CRYPTO_SECRET = "test-secret-that-is-32-bytes-long!!";
  });

  it("round-trips creds + binary signal keys byte-identically", async () => {
    const store = new BaileysSessionStore();
    const creds = initAuthCreds();
    const signedKey = new Uint8Array([1, 2, 3, 250, 251]);

    // In-memory key bag with binary signal material, exposed as __bag for extraction on save.
    const bag: Record<string, Record<string, unknown>> = {
      "pre-key": {
        "1": { public: new Uint8Array([9, 8, 7]), private: signedKey },
      },
      session: {
        "peer@s.whatsapp.net": signedKey,
      },
    };

    const state = {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const cat = bag[type] ?? {};
          const out: Record<string, unknown> = {};
          for (const id of ids) out[id] = cat[id] ?? null;
          return out;
        },
        set: async (data: Record<string, Record<string, unknown | null>>) => {
          for (const [type, cat] of Object.entries(data)) {
            bag[type] = bag[type] || {};
            for (const [id, val] of Object.entries(cat ?? {})) {
              if (val === null) delete bag[type][id];
              else bag[type][id] = val;
            }
          }
        },
        clear: async () => {
          for (const k of Object.keys(bag)) delete bag[k];
        },
        __bag: bag,
      },
    } as never;

    // Persist via saveAuthState → capture encrypted payload
    let persisted: unknown;
    const upsert = vi.fn(async (_row: unknown) => {
      persisted = (_row as { session_data: Buffer }).session_data;
      return { error: null };
    });
    mockFrom.mockReturnValue({ upsert });

    await store.saveAuthState("tenant-1", state);
    expect(upsert).toHaveBeenCalled();
    expect(Buffer.isBuffer(persisted)).toBe(true);

    // getAuthState with mocked row
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { session_data: persisted, encryption_key_id: "v1" },
            error: null,
          }),
        }),
      }),
    });

    const restored = await store.getAuthState("tenant-1");
    expect(restored).not.toBeNull();
    expect(restored!.creds).toEqual(creds);
    expect(typeof restored!.keys.get).toBe("function");
    expect(typeof restored!.keys.set).toBe("function");
    expect(typeof restored!.keys.clear).toBe("function");

    // Byte-identical binary key material through BufferJSON round-trip
    const sessions = (await restored!.keys.get("session", ["peer@s.whatsapp.net"])) as Record<
      string,
      Uint8Array
    >;
    expect(Buffer.from(sessions["peer@s.whatsapp.net"])).toEqual(Buffer.from(signedKey));

    const preKeys = (await restored!.keys.get("pre-key", ["1"])) as Record<
      string,
      { public: Uint8Array; private: Uint8Array }
    >;
    expect(Buffer.from(preKeys["1"].public)).toEqual(Buffer.from(new Uint8Array([9, 8, 7])));
    expect(Buffer.from(preKeys["1"].private)).toEqual(Buffer.from(signedKey));
  });

  it("returns null when no row exists", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: { code: "PGRST116" } }) }),
      }),
    });
    const store = new BaileysSessionStore();
    await expect(store.getAuthState("missing")).resolves.toBeNull();
  });

  it("hasSession is false without a row and true with one", async () => {
    const store = new BaileysSessionStore();
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    });
    await expect(store.hasSession("t1")).resolves.toBe(false);

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { id: "row-1" }, error: null }) }),
      }),
    });
    await expect(store.hasSession("t1")).resolves.toBe(true);
  });
});
