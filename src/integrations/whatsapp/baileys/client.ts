// Copyright (c) 2026 QRslice. All rights reserved.
import { BaileysConnectionManager } from "./connection-manager";
import type { WhatsAppProvider, WhatsAppStatus, WhatsAppMessageResult, DocumentPayload, WhatsAppTemplate, TemplateComponent, TemplateParameter } from "@/integrations/whatsapp/whatsapp.interface";

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
    const socket = this.manager.getSocket(accountId);
    if (!socket) {
      return { success: false, error: "Not connected" };
    }

    try {
      // Format phone number for Baileys (add @s.whatsapp.net if not present)
      const jid = recipient.includes("@") ? recipient : `${recipient}@s.whatsapp.net`;
      const result = await socket.sendMessage(jid, { text: message });
      return { success: true, messageId: result?.key?.id ?? undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async sendDocument(
    accountId: string,
    recipient: string,
    document: DocumentPayload
  ): Promise<WhatsAppMessageResult> {
    const socket = this.manager.getSocket(accountId);
    if (!socket) {
      return { success: false, error: "Not connected" };
    }

    try {
      const media = document.data instanceof Buffer
        ? document.data
        : Buffer.from(document.data as string, "base64");

      const jid = recipient.includes("@") ? recipient : `${recipient}@s.whatsapp.net`;
      const result = await socket.sendMessage(jid, {
        document: media,
        mimetype: document.mimeType,
        fileName: document.filename,
        caption: document.caption,
      });
      return { success: true, messageId: result?.key?.id ?? undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async sendTemplate(
    accountId: string,
    recipient: string,
    template: WhatsAppTemplate
  ): Promise<WhatsAppMessageResult> {
    const socket = this.manager.getSocket(accountId);
    if (!socket) {
      return { success: false, error: "Not connected" };
    }

    try {
      // For Baileys (WhatsApp Web), template messages are sent as regular text messages
      // Extract text content from template components
      const textContent = this.renderTemplateToText(template);

      const jid = recipient.includes("@") ? recipient : `${recipient}@s.whatsapp.net`;
      const result = await socket.sendMessage(jid, { text: textContent });
      return { success: true, messageId: result?.key?.id ?? undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Render WhatsAppTemplate components to plain text for Baileys
   */
  private renderTemplateToText(template: WhatsAppTemplate): string {
    const parts: string[] = [];

    for (const component of template.components) {
      if (component.type === "header" || component.type === "body" || component.type === "footer") {
        const textParams = component.parameters
          .filter((p): p is TemplateParameter & { text: string } => p.type === "text" && typeof p.text === "string")
          .map((p) => p.text)
          .join(" ");
        if (textParams) {
          parts.push(textParams);
        }
      }
      // Buttons are not rendered in plain text for now
    }

    return parts.join("\n\n");
  }
}

export const baileysClient = new BaileysClient();