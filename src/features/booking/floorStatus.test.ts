// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import { tableFloorState, calculateDetailedTableStatus } from "./floorStatus";

const now = new Date("2026-09-10T13:00:00+05:30");
const iso = (s: string) => new Date(s).toISOString();

describe("tableFloorState", () => {
  it("occupied wins over everything", () => {
    const r = [{ table_ids: ["t1"], starts_at: iso("2026-09-10T12:00:00+05:30"), ends_at: iso("2026-09-10T14:00:00+05:30") }];
    expect(tableFloorState("t1", now, r, new Set(["t1"])).state).toBe("occupied");
  });
  it("held when covering now", () => {
    const r = [{ table_ids: ["t1"], starts_at: iso("2026-09-10T12:00:00+05:30"), ends_at: iso("2026-09-10T14:00:00+05:30") }];
    const out = tableFloorState("t1", now, r, new Set());
    expect(out.state).toBe("held");
    expect(out.detail).toContain("Booked");
  });
  it("reserved when starting within 60 min", () => {
    const r = [{ table_ids: ["t1"], starts_at: iso("2026-09-10T13:45:00+05:30"), ends_at: iso("2026-09-10T15:00:00+05:30") }];
    expect(tableFloorState("t1", now, r, new Set()).state).toBe("reserved");
  });
  it("free otherwise", () => {
    expect(tableFloorState("t9", now, [], new Set())).toEqual({ state: "free", detail: null });
  });
  it("ignores other tables", () => {
    const r = [{ table_ids: ["t2"], starts_at: iso("2026-09-10T12:00:00+05:30"), ends_at: iso("2026-09-10T14:00:00+05:30") }];
    expect(tableFloorState("t1", now, r, new Set()).state).toBe("free");
  });
});

describe("calculateDetailedTableStatus (Visual Floor Grid)", () => {
  const table = { id: "tbl-1", label: "04", seats: 4 };

  it("returns available when no orders exist", () => {
    const res = calculateDetailedTableStatus(table, [], [], new Set(), now);
    expect(res.state).toBe("available");
    expect(res.orderCount).toBe(0);
    expect(res.totalPaise).toBe(0);
  });

  it("returns seated when order is placed or pending", () => {
    const orders = [
      {
        id: "ord-1",
        table_id: "tbl-1",
        status: "placed",
        payment_status: "unpaid",
        total_paise: 45000,
        created_at: iso("2026-09-10T12:50:00+05:30"),
        items: [{ item_name: "Cold Coffee", quantity: 2 }],
      },
    ];
    const res = calculateDetailedTableStatus(table, orders, [], new Set(), now);
    expect(res.state).toBe("seated");
    expect(res.orderCount).toBe(1);
    expect(res.totalPaise).toBe(45000);
    expect(res.elapsedMinutes).toBe(10);
    expect(res.itemsSummary).toContain("2× Cold Coffee");
  });

  it("returns cooking when order is preparing in kitchen", () => {
    const orders = [
      {
        id: "ord-2",
        table_id: "tbl-1",
        status: "preparing",
        payment_status: "unpaid",
        total_paise: 68000,
        created_at: iso("2026-09-10T12:45:00+05:30"),
        items: [{ item_name: "Butter Chicken", quantity: 1 }],
      },
    ];
    const res = calculateDetailedTableStatus(table, orders, [], new Set(), now);
    expect(res.state).toBe("cooking");
    expect(res.badgeText).toContain("Cooking");
    expect(res.elapsedMinutes).toBe(15);
  });

  it("returns needs_bill when food is served or ready and payment is unpaid", () => {
    const orders = [
      {
        id: "ord-3",
        table_id: "tbl-1",
        status: "served",
        payment_status: "unpaid",
        total_paise: 82000,
        created_at: iso("2026-09-10T12:20:00+05:30"),
        customer_name: "Aman",
      },
    ];
    const res = calculateDetailedTableStatus(table, orders, [], new Set(), now);
    expect(res.state).toBe("needs_bill");
    expect(res.customerName).toBe("Aman");
    expect(res.totalPaise).toBe(82000);
  });

  it("returns needs_bill immediately when billRequestedTableIds includes this table", () => {
    const orders = [
      {
        id: "ord-4",
        table_id: "tbl-1",
        status: "preparing",
        payment_status: "unpaid",
        total_paise: 50000,
      },
    ];
    const res = calculateDetailedTableStatus(table, orders, [], new Set(["tbl-1"]), now);
    expect(res.state).toBe("needs_bill");
    expect(res.hasBillRequest).toBe(true);
  });
});
