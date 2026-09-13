// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { calcMrr } from "./platform-mrr";

describe("calcMrr", () => {
  it("active count times monthly paise", () => {
    expect(calcMrr(3, 99900)).toBe(299700);
  });
  it("zero actives is zero", () => {
    expect(calcMrr(0, 99900)).toBe(0);
  });
});
