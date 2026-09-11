import { describe, expect, it } from "vitest";
import { tableFloorState } from "./floorStatus";

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
