// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { WhatsAppProvider, WhatsAppStatus, WhatsAppMessageResult } from "@/integrations/whatsapp/whatsapp.interface";

describe("WhatsApp Types", () => {
  it("exports WhatsAppProvider interface with required methods", () => {
    const provider: WhatsAppProvider = {
      connect: async () => {},
      disconnect: async () => {},
      getStatus: async () => ({ connected: false }),
      sendText: async () => ({ success: false }),
      sendDocument: async () => ({ success: false }),
      sendTemplate: async () => ({ success: false }),
    };

    expect(typeof provider.connect).toBe("function");
    expect(typeof provider.getStatus).toBe("function");
    expect(typeof provider.disconnect).toBe("function");
    expect(typeof provider.sendText).toBe("function");
    expect(typeof provider.sendDocument).toBe("function");
    expect(typeof provider.sendTemplate).toBe("function");
  });

  it("exports WhatsAppStatus type", () => {
    const status: WhatsAppStatus = {
      connected: true,
      phoneNumber: "+1234567890",
      lastSeen: "2026-09-18T10:00:00Z",
      qrCode: "qr-code-data",
    };
    expect(status.connected).toBe(true);
    expect(status.phoneNumber).toBe("+1234567890");
  });

  it("exports WhatsAppMessageResult type", () => {
    const result: WhatsAppMessageResult = {
      success: true,
      messageId: "msg-123",
    };
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg-123");
  });

  it("allows WhatsAppMessageResult with error", () => {
    const result: WhatsAppMessageResult = {
      success: false,
      error: "Failed to send",
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to send");
  });
});