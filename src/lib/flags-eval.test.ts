// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { isFlagOn } from "./flags-eval";

export type RolloutFlag = { enabled: boolean; rollout_pct: number; allow_list: string[] };

describe("isFlagOn", () => {
  it("disabled flag is off even with allow-list", () => {
    expect(isFlagOn({ enabled: false, rollout_pct: 100, allow_list: ["r1"] }, "r1")).toBe(false);
  });
  it("allow-list wins at 0% rollout", () => {
    expect(isFlagOn({ enabled: true, rollout_pct: 0, allow_list: ["r1"] }, "r1")).toBe(true);
  });
  it("100% rollout is on for anyone", () => {
    expect(isFlagOn({ enabled: true, rollout_pct: 100, allow_list: [] }, "zzz")).toBe(true);
  });
});
