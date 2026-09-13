// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { escapeOrFilter } from "./platform-filter";

describe("escapeOrFilter", () => {
  it("escapes commas", () => {
    expect(escapeOrFilter("a,b")).toBe("a\\,b");
  });
  it("escapes parens", () => {
    expect(escapeOrFilter("a(b)c")).toBe("a\\(b\\)c");
  });
  it("escapes percent", () => {
    expect(escapeOrFilter("100%")).toBe("100\\%");
  });
  it("escapes quotes", () => {
    expect(escapeOrFilter('say "hi"')).toBe('say \\"hi\\"');
  });
  it("escapes backslashes first", () => {
    expect(escapeOrFilter("a\\b")).toBe("a\\\\b");
  });
  it("leaves plain text untouched", () => {
    expect(escapeOrFilter("amber-coffee")).toBe("amber-coffee");
  });
});
