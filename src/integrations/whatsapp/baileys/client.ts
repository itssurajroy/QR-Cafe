// Copyright (c) 2026 QRslice. All rights reserved.
import { BaileysConnectionManager } from "./connection-manager";
import type { WhatsAppProvider, WhatsAppStatus, WhatsAppMessageResult, DocumentPayload, WhatsAppTemplate } from "@/integrations/whatsapp/whatsapp.interface";

/**
 * BaileysClient implements the WhatsAppProvider interface using Baileys
 * This is the main entry point for WhatsApp Business API via Baileys
 */
export class BaileysClient implements WhatsAppProvider {
  private manager: BaileysConnectionManager;

  constructor(manager?: BaileysConnectionManager) {
    this.manager = manager || new BaileysConnectionManager();
  }

  async connect(accountId: string): Promise<void> {
    return this.manager.connect(accountId);
  }

  async disconnect(accountId: string): Promise<void> {
    return this.manager.disconnect(accountId);
  }

  async getStatus(accountId: string): Promise<WhatsAppStatus> {
    return this.manager.getStatus(accountId);
  }

  async sendText(
    accountId: string,
    recipient: string,
    message: string
  ): Promise<WhatsAppMessageResult> {
    const socket = (this.manager as any).connections?.get(accountId);
    if (!socket) {
      return { success: false, error: "Not connected" };
    }

    try {
      const result = await socket.sendMessage(recipient, { text: message });
      return { success: true, messageId: result?.key?.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async sendDocument(
    accountId: string,
    recipient: string,
    document: DocumentPayload
  ): Promise<WhatsAppMessageResult> {
    const socket = (this.manager as any).connections?.get(accountId);
    if (!socket) {
      return { success: false, error: "Not connected" };
    }

    try {
      const media = document.data instanceof Buffer
        ? document.data
        : Buffer.from(document.data as string, "base64");

      const result = await socket.sendMessage(recipient, {
        document: media,
        mimetype: document.mimeType,
        fileName: document.filename,
        caption: document.caption,
      });
      return { success: true, messageId: result?.key?.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async sendTemplate(
    accountId: string,
    recipient: string,
    template: WhatsAppTemplate
  ): Promise<WhatsAppMessageResult> {
    // Baileys doesn't support template messages directly like Cloud API
    // This would require implementing template message format manually
    return { success: false, error: "Template messages not supported via Baileys" };
  }
}

export const baileysClient = new BaileysClient();