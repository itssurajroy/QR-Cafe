import { resolveTableByLabel } from "../lib/table-helpers";
import { describe, it, expect } from "vitest";

describe("resolveTableByLabel", () => {
  const tables = [{ label: "T1" }, { label: "T2" }, { label: "T10" }] as any;
  it("resolves 01 -> T1", () => expect(resolveTableByLabel(tables, "01")?.label).toBe("T1"));
  it("resolves T01 -> T1", () => expect(resolveTableByLabel(tables, "T01")?.label).toBe("T1"));
  it("resolves t1 -> T1", () => expect(resolveTableByLabel(tables, "t1")?.label).toBe("T1"));
  it("resolves 10 -> T10", () => expect(resolveTableByLabel(tables, "10")?.label).toBe("T10"));
  it("returns null for missing", () => expect(resolveTableByLabel(tables, "T99")).toBeNull());
});
