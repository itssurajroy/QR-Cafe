// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi } from "vitest";
import {
  countCustomerVisit,
  getCustomerBalance,
  processCustomerLoyalty,
  redeemCustomerPoints,
  reverseCustomerLoyalty,
} from "./crm";

function mockDb(rpcImpl?: (fn: string, args: unknown) => unknown) {
  const rpc = vi.fn(async (fn: string, args: unknown) => {
    if (rpcImpl) return { data: rpcImpl(fn, args), error: null };
    return { data: {}, error: null };
  });
  const select = vi.fn(() => ({
    eq: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { id: "c1", loyalty_points: 10, name: "A" }, error: null }),
      }),
    }),
  }));
  return { rpc, from: vi.fn(() => ({ select })), select } as never;
}

describe("crm loyalty RPCs", () => {
  it("processCustomerLoyalty returns zero for empty phone without calling rpc", async () => {
    const db = mockDb();
    const res = await processCustomerLoyalty(db, "r1", "", "A", 10000);
    expect(res).toEqual({ pointsEarned: 0, newTotalPoints: 0 });
    expect((db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).not.toHaveBeenCalled();
  });

  it("processCustomerLoyalty maps p_earn_loyalty payload", async () => {
    const db = mockDb(() => ({
      pointsEarned: 6,
      newTotalPoints: 16,
      customerId: "c1",
      already: false,
    }));
    const res = await processCustomerLoyalty(db, "r1", "999", "Aman", 63000, "o1", "01");
    expect(res).toEqual({
      pointsEarned: 6,
      newTotalPoints: 16,
      customerId: "c1",
      already: false,
    });
    const rpc = (db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc;
    expect(rpc).toHaveBeenCalledWith("p_earn_loyalty", {
      p_restaurant_id: "r1",
      p_phone: "999",
      p_name: "Aman",
      p_total_paise: 63000,
      p_order_id: "o1",
      p_order_number: "01",
    });
  });

  it("processCustomerLoyalty treats already-earned order as zero new points", async () => {
    const db = mockDb(() => ({
      pointsEarned: 0,
      newTotalPoints: 16,
      customerId: "c1",
      already: true,
    }));
    const res = await processCustomerLoyalty(db, "r1", "999", "A", 63000, "o1");
    expect(res.pointsEarned).toBe(0);
    expect(res.already).toBe(true);
    expect(res.newTotalPoints).toBe(16);
  });

  it("processCustomerLoyalty throws on rpc error", async () => {
    const db = {
      rpc: vi.fn(async () => ({ data: null, error: { message: "boom" } })),
      from: vi.fn(),
    } as never;
    await expect(
      processCustomerLoyalty(db, "r1", "999", "A", 10000),
    ).rejects.toThrow(/Failed to process loyalty: boom/);
  });

  it("getCustomerBalance reads row", async () => {
    const db = mockDb();
    const bal = await getCustomerBalance(db, "r1", "999");
    expect(bal).toEqual({ id: "c1", points: 10, name: "A" });
  });

  it("redeemCustomerPoints returns false for invalid input without rpc", async () => {
    const db = mockDb();
    expect(await redeemCustomerPoints(db, "r1", "", 10)).toBe(false);
    expect(await redeemCustomerPoints(db, "r1", "999", 0)).toBe(false);
    expect((db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).not.toHaveBeenCalled();
  });

  it("redeemCustomerPoints maps insufficient error", async () => {
    const db = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: "Insufficient loyalty points" },
      })),
      from: vi.fn(),
    } as never;
    await expect(
      redeemCustomerPoints(db, "r1", "999", 5, "o1"),
    ).rejects.toThrow("Insufficient loyalty points");
  });

  it("redeemCustomerPoints succeeds and returns true", async () => {
    const db = mockDb(() => ({ ok: true, newPoints: 5 }));
    expect(await redeemCustomerPoints(db, "r1", "999", 5, "o1")).toBe(true);
    const rpc = (db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc;
    expect(rpc).toHaveBeenCalledWith("p_redeem_loyalty", {
      p_restaurant_id: "r1",
      p_phone: "999",
      p_points: 5,
      p_order_id: "o1",
    });
  });

  it("reverseCustomerLoyalty no-ops without orderId", async () => {
    const db = mockDb();
    await reverseCustomerLoyalty(db, "r1", "");
    expect((db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).not.toHaveBeenCalled();
  });

  it("reverseCustomerLoyalty calls p_reverse_loyalty with reason", async () => {
    const db = mockDb(() => ({ reversed: 1, already: false }));
    await reverseCustomerLoyalty(db, "r1", "o1", "Customer Bill Refund");
    const rpc = (db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc;
    expect(rpc).toHaveBeenCalledWith("p_reverse_loyalty", {
      p_restaurant_id: "r1",
      p_order_id: "o1",
      p_reason: "Customer Bill Refund",
    });
  });

  it("reverseCustomerLoyalty throws on rpc error", async () => {
    const db = {
      rpc: vi.fn(async () => ({ data: null, error: { message: "nope" } })),
      from: vi.fn(),
    } as never;
    await expect(reverseCustomerLoyalty(db, "r1", "o1")).rejects.toThrow(
      /Failed to reverse loyalty/,
    );
  });

  it("countCustomerVisit returns null for empty phone", async () => {
    const db = mockDb();
    expect(await countCustomerVisit(db, "r1", "")).toBeNull();
    expect((db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).not.toHaveBeenCalled();
  });

  it("countCustomerVisit maps visit payload", async () => {
    const db = mockDb(() => ({ customerId: "c1", visitCount: 3 }));
    const res = await countCustomerVisit(db, "r1", "999", "Aman");
    expect(res).toEqual({ customerId: "c1", visitCount: 3 });
    const rpc = (db as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc;
    expect(rpc).toHaveBeenCalledWith("p_count_visit", {
      p_restaurant_id: "r1",
      p_phone: "999",
      p_name: "Aman",
    });
  });
});
