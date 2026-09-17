// Copyright (c) 2026 QRslice. All rights reserved.

export interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  lastSeen?: string;
  qrCode?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DocumentPayload {
  filename: string;
  mimeType: string;
  data: Buffer | string;
  caption?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: "header" | "body" | "footer" | "button";
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  currency?: {
    fallback_value: string;
    currency_code: string;
  };
  date_time?: string;
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename: string;
  };
  video?: {
    link: string;
  };
}