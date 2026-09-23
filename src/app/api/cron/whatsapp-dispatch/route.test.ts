// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/whatsapp-dispatch/route";

type QueryResult = { data?: unknown; error?: { message: string } | null };

type QueryState = {
  table: string;
  op?: "select" | "update" | "insert";
  columns?: unknown;
  values?: Record<string, unknown>;
  filters: Array<[string, unknown]>;
  throwOnError?: boolean;
};

const db = vi.hoisted(() => {
  const calls: QueryState[] = [];
  type R = { data?: unknown; error?: { message: string } | null };
  const defaultResponder = (): R => ({ data: null, error: null });
  let responder: (state: QueryState) => R = defaultResponder;

  function makeFrom(table: string) {
    const state: QueryState = { table, filters: [] };
    calls.push(state);
    const self: Record<string, unknown> = {};
    self.select = (cols?: unknown) => {
      if (!state.op) state.op = "select";
      state.columns = cols;
      return self;
    };
    self.update = (values: Record<string, unknown>) => {
      state.op = "update";
      state.values = values;
      return self;
    };
    self.insert = (values: unknown) => {
      state.op = "insert";
      state.values = values as Record<string, unknown>;
      return self;
    };
    self.eq = (col: string, val: unknown) => {
      state.filters.push([col, val]);
      return self;
    };
    self.lte = (col: string, val: unknown) => {
      state.filters.push([col, val]);
      return self;
    };
    self.lt = (col: string, val: unknown) => {
      state.filters.push([col, val]);
      return self;
    };
    self.throwOnError = () => {
      state.throwOnError = true;
      return self;
    };
    self.order = () => self;
    self.limit = () => self;
    function settle(): R {
      const r = responder(state);
      if (state.throwOnError && r.error) throw new Error(r.error.message);
      return r;
    }
    self.maybeSingle = () => Promise.resolve(settle());
    self.single = () => Promise.resolve(settle());
    self.then = (onFulfilled: unknown, onRejected: unknown) =>
      Promise.resolve(settle()).then(
        onFulfilled as (v: R) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    return self;
  }

  return {
    calls,
    makeFrom,
    setResponder(r: (state: QueryState) => R) {
      responder = r;
    },
    reset() {
      calls.length = 0;
      responder = defaultResponder;
    },
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({ from: db.makeFrom }),
}));

const {
  connectMock,
  waitForOpenMock,
  getSocketMock,
  releaseMock,
  disconnectMock,
  sendMessageMock,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  waitForOpenMock: vi.fn(),
  getSocketMock: vi.fn(),
  releaseMock: vi.fn(),
  disconnectMock: vi.fn(),
  sendMessageMock: vi.fn(),
}));

vi.mock("@/integrations/whatsapp/baileys/connection-manager", () => ({
  BaileysConnectionManager: class {
    connect = connectMock;
    waitForOpen = waitForOpenMock;
    getSocket = getSocketMock;
    release = releaseMock;
    disconnect = disconnectMock;
  },
}));

const { hasSessionMock } = vi.hoisted(() => ({ hasSessionMock: vi.fn() }));

vi.mock("@/integrations/whatsapp/baileys/session-store", () => ({
  BaileysSessionStore: class {
    hasSession = hasSessionMock;
  },
}));

const dueBillRow = {
  id: "msg-1",
  tenant_id: "rest-1",
  order_id: "order-1",
  message_type: "bill_receipt",
  recipient_phone: "9876543210",
  template_variables: {},
  retry_count: 0,
  max_retries: 3,
};

const orderRow = {
  id: "order-1",
  order_number: "ORD-42",
  table_label: "T5",
  total_paise: 250000,
  payment_status: "paid",
  payment_method: "upi",
  status_token: "tok123",
  order_items: [
    { item_name: "Paneer Tikka", quantity: 2, line_total_paise: 40000 },
    { item_name: "Butter Naan", quantity: 1, line_total_paise: 6000 },
  ],
};

const restaurantRow = { name: "Curry Leaf", gstin: "29ABCDE1234F1Z5" };

function respondDue(rows: unknown[]) {
  return (state: QueryState): QueryResult => {
    if (state.table === "whatsapp_messages" && state.op === "select") {
      return { data: rows, error: null };
    }
    if (
      state.table === "whatsapp_messages" &&
      state.op === "update" &&
      state.values?.status === "sending"
    ) {
      const row = rows[0] as { id: string } | undefined;
      return row ? { data: { id: row.id }, error: null } : { data: null, error: null };
    }
    return { data: null, error: null };
  };
}

function baseResponder(rows: unknown[]) {
  return (state: QueryState): QueryResult => {
    const base = respondDue(rows)(state);
    if (state.table === "whatsapp_messages" && state.op === "select") return base;
    if (state.table === "whatsapp_messages" && state.op === "update" && state.values?.status === "sending") {
      return base;
    }
    if (state.table === "whatsapp_settings") return { data: { enabled: true }, error: null };
    if (state.table === "orders") return { data: orderRow, error: null };
    if (state.table === "restaurants") return { data: restaurantRow, error: null };
    return { data: null, error: null };
  };
}

function cronReq(auth?: string): NextRequest {
  const headers = new Headers();
  if (auth !== undefined) headers.set("authorization", auth);
  return new NextRequest("http://localhost/api/cron/whatsapp-dispatch", {
    method: "GET",
    headers,
  });
}

function messageUpdates() {
  return db.calls.filter((c) => c.table === "whatsapp_messages" && c.op === "update");
}

describe("GET /api/cron/whatsapp-dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    db.reset();
    hasSessionMock.mockResolvedValue(true);
    connectMock.mockResolvedValue(undefined);
    waitForOpenMock.mockResolvedValue(undefined);
    releaseMock.mockResolvedValue(undefined);
    disconnectMock.mockResolvedValue(undefined);
    sendMessageMock.mockResolvedValue({ key: { id: "wamid.TEST" } });
    getSocketMock.mockReturnValue({ sendMessage: sendMessageMock });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when auth header is wrong", async () => {
    const res = await GET(cronReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await GET(cronReq("Bearer anything"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/CRON_SECRET/);
  });

  it("returns 200 with zero counters when no due rows", async () => {
    db.setResponder(respondDue([]));

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 0, sent: 0, deferred: 0, failed: 0 });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("claims pending row, connects, sends bill text, marks sent, logs event, releases (not disconnect)", async () => {
    db.setResponder(baseResponder([dueBillRow]));

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 1, deferred: 0, failed: 0 });

    const claim = messageUpdates().find((c) => c.values?.status === "sending");
    expect(claim).toBeDefined();
    expect(claim!.filters).toEqual(
      expect.arrayContaining([
        ["id", "msg-1"],
        ["status", "pending"],
      ]),
    );

    expect(connectMock).toHaveBeenCalledWith("rest-1", { autoReconnect: false });
    expect(waitForOpenMock).toHaveBeenCalledWith("rest-1", 25_000);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    const [jid, payload] = sendMessageMock.mock.calls[0] as [
      string,
      { text: string },
    ];
    expect(jid).toBe("919876543210@s.whatsapp.net");
    expect(payload.text).toContain("*Curry Leaf*");
    expect(payload.text).toContain("GSTIN: 29ABCDE1234F1Z5");
    expect(payload.text).toContain("2 x Paneer Tikka — ₹400.00");
    expect(payload.text).toContain("*Total: ₹2,500.00*");
    expect(payload.text).toContain("https://www.qrslice.com/receipt/tok123");

    const orderSelect = db.calls.find((c) => c.table === "orders" && c.op === "select");
    expect(orderSelect?.columns).toContain("order_items(item_name, quantity, line_total_paise)");
    expect(orderSelect?.filters).toEqual(
      expect.arrayContaining([
        ["id", "order-1"],
        ["restaurant_id", "rest-1"],
      ]),
    );

    const sentUpdate = messageUpdates().find((c) => c.values?.status === "sent");
    expect(sentUpdate?.values).toMatchObject({
      provider_message_id: "wamid.TEST",
      error_message: null,
    });
    expect(sentUpdate?.values?.sent_at).toBeTruthy();

    const eventInsert = db.calls.find(
      (c) => c.table === "whatsapp_message_events" && c.op === "insert",
    );
    expect(eventInsert?.values).toMatchObject({
      tenant_id: "rest-1",
      message_id: "msg-1",
      event_type: "sent",
      payload: { providerMessageId: "wamid.TEST" },
    });

    const accountUpdate = db.calls.find(
      (c) => c.table === "whatsapp_accounts" && c.op === "update",
    );
    expect(accountUpdate?.values?.last_seen_at).toBeTruthy();

    expect(releaseMock).toHaveBeenCalledWith("rest-1");
    expect(disconnectMock).not.toHaveBeenCalled();
  });

  it("defers with 'not linked' when session missing — no retry storm, no connect", async () => {
    db.setResponder(baseResponder([dueBillRow]));
    hasSessionMock.mockResolvedValue(false);

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 0, deferred: 1, failed: 0 });

    const failedUpdate = messageUpdates().find((c) => c.values?.status === "failed");
    expect(failedUpdate?.values?.error_message).toMatch(/not linked/);
    expect(failedUpdate?.values).not.toHaveProperty("retry_count");
    expect(failedUpdate?.values).not.toHaveProperty("scheduled_at");

    expect(connectMock).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("defers when settings disabled — hasSession not consulted, no connect", async () => {
    db.setResponder((state) => {
      if (state.table === "whatsapp_settings") return { data: { enabled: false }, error: null };
      return baseResponder([dueBillRow])(state);
    });

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 0, deferred: 1, failed: 0 });

    const failedUpdate = messageUpdates().find((c) => c.values?.status === "failed");
    expect(failedUpdate?.values?.error_message).toMatch(/disabled/i);
    expect(hasSessionMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("skips row when conditional claim loses race", async () => {
    db.setResponder((state) => {
      if (state.table === "whatsapp_messages" && state.op === "select") {
        return { data: [dueBillRow], error: null };
      }
      if (state.table === "whatsapp_messages" && state.op === "update" && state.values?.status === "sending") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 0, sent: 0, deferred: 0, failed: 0 });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("requeues with future scheduled_at and retry_count++ when send throws", async () => {
    db.setResponder(baseResponder([dueBillRow]));
    sendMessageMock.mockRejectedValue(new Error("socket down"));

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 0, deferred: 0, failed: 1 });

    const retryUpdate = messageUpdates().find(
      (c) => c.values?.status === "pending" && "retry_count" in (c.values ?? {}),
    );
    expect(retryUpdate?.values?.retry_count).toBe(1);
    expect(retryUpdate?.values?.error_message).toMatch(/socket down/);
    const scheduledAt = retryUpdate?.values?.scheduled_at as string;
    expect(scheduledAt).toBeTruthy();
    const delay = new Date(scheduledAt).getTime() - Date.now();
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(15 * 60_000);

    expect(releaseMock).toHaveBeenCalledWith("rest-1");
    expect(disconnectMock).not.toHaveBeenCalled();
  });

  it("marks failed without scheduled_at when retries exhausted", async () => {
    const row = { ...dueBillRow, retry_count: 2, max_retries: 3 };
    db.setResponder(baseResponder([row]));
    sendMessageMock.mockRejectedValue(new Error("always fails"));

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 0, deferred: 0, failed: 1 });

    const failUpdate = messageUpdates().find((c) => c.values?.status === "failed");
    expect(failUpdate?.values?.retry_count).toBe(3);
    expect(failUpdate?.values).not.toHaveProperty("scheduled_at");
  });

  it("does not requeue when bookkeeping fails after sendMessage succeeded", async () => {
    db.setResponder((state) => {
      if (
        state.table === "whatsapp_messages" &&
        state.op === "update" &&
        state.values?.status === "sent"
      ) {
        throw new Error("db write failed");
      }
      return baseResponder([dueBillRow])(state);
    });

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 1, deferred: 0, failed: 0 });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);

    const requeue = messageUpdates().find(
      (c) =>
        c.values?.status === "pending" &&
        c.filters.some(([col, val]) => col === "id" && val === "msg-1"),
    );
    expect(requeue).toBeUndefined();
    expect(messageUpdates().some((c) => "retry_count" in (c.values ?? {}))).toBe(false);
    expect(
      messageUpdates().some(
        (c) =>
          "scheduled_at" in (c.values ?? {}) &&
          c.filters.some(([col, val]) => col === "id" && val === "msg-1"),
      ),
    ).toBe(false);
    expect(messageUpdates().some((c) => c.values?.status === "failed")).toBe(false);
  });

  it("routes primary sent-write {error} failure into sendSucceeded path — not requeued, best-effort resend attempted", async () => {
    let sentAttempts = 0;
    db.setResponder((state) => {
      if (
        state.table === "whatsapp_messages" &&
        state.op === "update" &&
        state.values?.status === "sent"
      ) {
        sentAttempts++;
        if (sentAttempts === 1) {
          return { data: null, error: { message: "postgrest unavailable" } };
        }
        return { data: null, error: null };
      }
      return baseResponder([dueBillRow])(state);
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const res = await GET(cronReq("Bearer test-cron-secret"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ claimed: 1, sent: 1, deferred: 0, failed: 0 });
      expect(sendMessageMock).toHaveBeenCalledTimes(1);
      expect(sentAttempts).toBe(2);
      expect(
        messageUpdates().find(
          (c) =>
            c.values?.status === "pending" &&
            c.filters.some(([col, val]) => col === "id" && val === "msg-1"),
        ),
      ).toBeUndefined();
      expect(messageUpdates().some((c) => "retry_count" in (c.values ?? {}))).toBe(false);
      expect(messageUpdates().some((c) => c.values?.status === "failed")).toBe(false);
      const bestEffort = messageUpdates().filter((c) => c.values?.status === "sent");
      expect(bestEffort).toHaveLength(2);
      expect(bestEffort[1].values).toMatchObject({ provider_message_id: "wamid.TEST" });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("post-send bookkeeping failed for msg-1"),
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("surfaces double sent-write failure as sent-counted, never requeued (residual two-failure case)", async () => {
    let sentAttempts = 0;
    db.setResponder((state) => {
      if (
        state.table === "whatsapp_messages" &&
        state.op === "update" &&
        state.values?.status === "sent"
      ) {
        sentAttempts++;
        return { data: null, error: { message: "db down" } };
      }
      return baseResponder([dueBillRow])(state);
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const res = await GET(cronReq("Bearer test-cron-secret"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ claimed: 1, sent: 1, deferred: 0, failed: 0 });
      expect(sentAttempts).toBe(2);
      expect(messageUpdates().some((c) => "retry_count" in (c.values ?? {}))).toBe(false);
      expect(
        messageUpdates().some(
          (c) =>
            (c.values?.status === "pending" || c.values?.status === "failed") &&
            c.filters.some(([col]) => col === "id"),
        ),
      ).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("post-send bookkeeping failed for msg-1"),
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("reclaims stale sending rows back to pending before the due fetch", async () => {
    const before = Date.now();
    let reclaimed = false;
    const staleRow = { ...dueBillRow, id: "msg-stale" };
    db.setResponder((state) => {
      if (
        state.table === "whatsapp_messages" &&
        state.op === "update" &&
        state.values?.status === "pending" &&
        state.filters.some(([col, val]) => col === "status" && val === "sending")
      ) {
        reclaimed = true;
        return { data: null, error: null };
      }
      return baseResponder(reclaimed ? [staleRow] : [])(state);
    });

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 1, deferred: 0, failed: 0 });
    expect(reclaimed).toBe(true);

    const reclaim = messageUpdates().find(
      (c) =>
        c.values?.status === "pending" &&
        c.filters.some(([col, val]) => col === "status" && val === "sending"),
    );
    expect(reclaim).toBeDefined();
    expect(reclaim!.filters).toEqual(
      expect.arrayContaining([["status", "sending"]]),
    );
    const lt = reclaim!.filters.find(([col]) => col === "updated_at");
    expect(lt).toBeDefined();
    const cutoff = new Date(lt![1] as string).getTime();
    expect(before - 6 * 60_000).toBeLessThanOrEqual(cutoff);
    expect(cutoff).toBeLessThanOrEqual(Date.now() - 4 * 60_000);

    const claim = messageUpdates().find((c) => c.values?.status === "sending");
    expect(claim?.filters).toEqual(
      expect.arrayContaining([
        ["id", "msg-stale"],
        ["status", "pending"],
      ]),
    );
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  it("sends template_variables.text for non-bill rows", async () => {
    const testRow = {
      ...dueBillRow,
      id: "msg-test",
      order_id: null,
      message_type: "test",
      template_variables: { text: "Hello from QRslice" },
    };
    db.setResponder(baseResponder([testRow]));

    const res = await GET(cronReq("Bearer test-cron-secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ claimed: 1, sent: 1, deferred: 0, failed: 0 });
    expect(sendMessageMock).toHaveBeenCalledWith("919876543210@s.whatsapp.net", {
      text: "Hello from QRslice",
    });
    expect(db.calls.some((c) => c.table === "orders")).toBe(false);
  });
});
