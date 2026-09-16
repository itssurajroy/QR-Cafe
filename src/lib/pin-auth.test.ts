// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it } from "vitest";
import {
  hashPin,
  signPinSession,
  validatePinFormat,
  verifyPinHash,
  verifyPinSession,
} from "./pin-auth";

const SECRET = "test-secret-for-pin-auth-unit-tests-only";
const RID = "00000000-0000-0000-0000-000000000001";
const PID = "00000000-0000-0000-0000-000000000002";

describe("validatePinFormat", () => {
  it("accepts exactly 4 digits", () => {
    expect(validatePinFormat("1234")).toBe(true);
    expect(validatePinFormat("0000")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(validatePinFormat("123")).toBe(false);
    expect(validatePinFormat("12345")).toBe(false);
    expect(validatePinFormat("12a4")).toBe(false);
    expect(validatePinFormat("")).toBe(false);
    expect(validatePinFormat(" 1234")).toBe(false);
  });
});

describe("hashPin / verifyPinHash", () => {
  it("verifies a correct PIN", async () => {
    const hash = await hashPin("2468", RID, PID, SECRET);
    expect(await verifyPinHash("2468", RID, PID, hash, SECRET)).toBe(true);
  });

  it("rejects a wrong PIN", async () => {
    const hash = await hashPin("2468", RID, PID, SECRET);
    expect(await verifyPinHash("2469", RID, PID, hash, SECRET)).toBe(false);
  });

  it("binds the hash to restaurant + profile (no cross-staff reuse)", async () => {
    const hash = await hashPin("2468", RID, PID, SECRET);
    expect(await verifyPinHash("2468", "other-restaurant", PID, hash, SECRET)).toBe(false);
    expect(await verifyPinHash("2468", RID, "other-profile", hash, SECRET)).toBe(false);
  });

  it("rejects malformed PINs without throwing", async () => {
    const hash = await hashPin("2468", RID, PID, SECRET);
    expect(await verifyPinHash("abc", RID, PID, hash, SECRET)).toBe(false);
    expect(await verifyPinHash("2468", RID, PID, "", SECRET)).toBe(false);
  });
});

describe("signPinSession / verifyPinSession", () => {
  it("round-trips a valid session", async () => {
    const token = await signPinSession({ sub: PID, rid: RID, role: "kitchen" }, SECRET);
    const payload = await verifyPinSession(token, SECRET);
    expect(payload).toMatchObject({ sub: PID, rid: RID, role: "kitchen" });
    expect(payload!.exp).toBeGreaterThan(Date.now());
  });

  it("rejects tampered tokens", async () => {
    const token = await signPinSession({ sub: PID, rid: RID, role: "waiter" }, SECRET);
    const [body, sig] = token.split(".");
    const tampered = `${body.slice(0, -2)}ab.${sig}`;
    expect(await verifyPinSession(tampered, SECRET)).toBeNull();
    expect(await verifyPinSession(`${body}.deadbeef`, SECRET)).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const token = await signPinSession(
      { sub: PID, rid: RID, role: "kitchen", exp: Date.now() - 1000 },
      SECRET,
    );
    expect(await verifyPinSession(token, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyPinSession("", SECRET)).toBeNull();
    expect(await verifyPinSession("not-a-token", SECRET)).toBeNull();
  });
});
