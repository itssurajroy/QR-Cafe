// src/wa/types.ts
import type { WASocket } from "@whiskeysockets/baileys";

export type CafeSocket = {
  restaurantId: string;
  phoneNumber: string;
  socket: WASocket;
  connected: boolean;
};

export type WhatsAppNotification = {
  orderId: string;
  restaurantId: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  customerPhone: string;
};

export type BillPayload = {
  restaurant: {
    name: string;
    address?: string;
    phone?: string;
    gstin?: string;
  };
  order: {
    order_number: string;
    table_label: string;
    created_at?: string;
    total_paise: number;
    subtotal_paise?: number;
    discount_paise?: number;
    payment_status: string;
    payment_method?: string;
  };
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price_paise: number;
  }>;
};
