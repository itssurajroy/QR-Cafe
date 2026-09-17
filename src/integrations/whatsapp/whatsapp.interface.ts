// Copyright (c) 2026 QRslice. All rights reserved.
export type {
  WhatsAppStatus,
  WhatsAppMessageResult,
  DocumentPayload,
  WhatsAppTemplate,
  TemplateComponent,
  TemplateParameter,
} from "./whatsapp.types";

import type {
  WhatsAppStatus,
  WhatsAppMessageResult,
  DocumentPayload,
  WhatsAppTemplate,
} from "./whatsapp.types";

export interface WhatsAppProvider {
  connect(accountId: string): Promise<void>;
  disconnect(accountId: string): Promise<void>;
  getStatus(accountId: string): Promise<WhatsAppStatus>;
  sendText(
    accountId: string,
    recipient: string,
    message: string
  ): Promise<WhatsAppMessageResult>;
  sendDocument(
    accountId: string,
    recipient: string,
    document: DocumentPayload
  ): Promise<WhatsAppMessageResult>;
  sendTemplate(
    accountId: string,
    recipient: string,
    template: WhatsAppTemplate
  ): Promise<WhatsAppMessageResult>;
}