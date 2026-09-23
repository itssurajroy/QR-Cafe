// Copyright (c) 2026 QRslice. All rights reserved.

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { describe, it } from "vitest";

describe("WhatsApp pairing APIs", () => {
  describe("GET /api/whatsapp/qr", () => {
    it("returns 401 when not authenticated", async () => {
      const req = new NextRequest("http://localhost/api/whatsapp/qr", {
        headers: {},
      });
    });

    it("returns 403 when role is not owner or super_admin", async () => {
    });

    it("returns QR data URL when manager emits qr", async () => {
    });
  });

  describe("GET /api/whatsapp/status", () => {
    it("returns 401 when not authenticated", async () => {
    });

    it("returns linked status from hasSession", async () => {
    });

    it("returns connected/phone/lastSeen from getStatus", async () => {
    });
  });

  describe("POST /api/whatsapp/disconnect", () => {
    it("returns 401 when not authenticated", async () => {
    });

    it("clears WhatsApp session and returns ok", async () => {
    });
  });
});