// Copyright (c) 2026 QRslice. All rights reserved.
import { describe,it,expect } from "vitest";
import { routeKeyword } from "./keyword-router";
describe("routeKeyword",()=>{
  it("MENU→menu link",()=>{ expect(routeKeyword("MENU",{restaurantSlug:"curryleaf"})!.reply).toMatch(/curryleaf.*menu/i) });
  it("HELP→support",()=>{ expect(routeKeyword("help",{})!.reply).toMatch(/support/i) });
  it("TRACK found",()=>{ expect(routeKeyword("TRACK ORD-123",{})).toBeTruthy() });
  it("unknown→null",()=>{ expect(routeKeyword("hello",{})).toBeNull() });
  it("trim+case",()=>{ expect(routeKeyword("  menu ",{})).not.toBeNull() });
});
