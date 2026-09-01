/**
 * QR Café — Typed API Client
 * All fetch() calls go through named, typed functions here.
 * No component should call fetch() directly.
 *
 * Pattern: each function returns ApiResponse<T>
 * On success: { data: T }
 * On error:   { error: string, code?: string }
 */

import type {
  Order,
  MenuItem,
  Category,
  Table,
  Restaurant,
  AnalyticsData,
  ApiResponse,
  PaymentMethod,
} from "@/types";

// ─── Internal Helper ──────────────────────────────────────────────────────────

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        error: json.error ?? `HTTP ${res.status}`,
        code: json.code ?? String(res.status),
        details: json.details,
      };
    }
    return { data: json as T };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Network error",
      code: "NETWORK_ERROR",
    };
  }
}

async function post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const api = {
  // ── Order Status ────────────────────────────────────────────────────────────

  getOrderStatus(token: string): Promise<ApiResponse<Order>> {
    return request<Order>(`/api/order-status/${token}`, { cache: "no-store" });
  },

  placeOrder(payload: {
    qrToken: string;
    items: Array<{ itemId: string; quantity: number; notes?: string; spiceLevel?: string; sizeVariant?: string }>;
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: string;
  }): Promise<ApiResponse<{ statusToken: string; orderNumber: string; order_id: string; status_token: string }>> {
    const body = {
      qr_token: payload.qrToken,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      payment_method: (payload.paymentMethod as "counter" | "online") ?? "counter",
      items: payload.items.map((it) => {
        const mods: Array<{ option_name: string; price_delta_paise: number }> = [];
        if (it.spiceLevel && it.spiceLevel !== "Medium") mods.push({ option_name: `Spice: ${it.spiceLevel}`, price_delta_paise: 0 });
        if (it.sizeVariant && it.sizeVariant !== "Regular") mods.push({ option_name: `Size: ${it.sizeVariant}`, price_delta_paise: 0 });
        const notes = [it.notes, it.spiceLevel ? `Spice:${it.spiceLevel}` : "", it.sizeVariant ? `Size:${it.sizeVariant}` : ""].filter(Boolean).join(" | ").slice(0, 500);
        return { menu_item_id: it.itemId, quantity: it.quantity, notes, modifiers: mods };
      }),
    };
    return post("/api/orders", body);
  },

  // ── POS / Admin Order Management ────────────────────────────────────────────

  updateOrderStatus(
    orderId: string,
    status: Order["status"],
  ): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", { type: "update_status", orderId, status });
  },

  settleOrder(
    orderId: string,
    paymentMethod: PaymentMethod,
    loyaltyPoints?: number,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", {
      type: "settle_order",
      orderId,
      paymentMethod,
      loyaltyPoints,
    });
  },

  voidOrder(orderId: string, reason?: string): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", { type: "void_order", orderId, reason });
  },

  sendWhatsappBill(
    orderId: string,
    phone: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", { type: "send_whatsapp_bill", orderId, phone });
  },

  // ── Menu Management ─────────────────────────────────────────────────────────

  toggleItemAvailability(
    itemId: string,
    available: boolean,
  ): Promise<ApiResponse<MenuItem>> {
    return post("/api/admin/crud", { type: "toggle_item_availability", itemId, available });
  },

  deleteItem(itemId: string): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", { type: "delete_item", itemId });
  },

  createItem(payload: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    return post("/api/admin/crud", { type: "create_item", ...payload });
  },

  updateItem(itemId: string, payload: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    return post("/api/admin/crud", { type: "update_item", itemId, ...payload });
  },

  createCategory(name: string): Promise<ApiResponse<Category>> {
    return post("/api/admin/crud", { type: "create_category", name });
  },

  deleteCategory(categoryId: string): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", { type: "delete_category", categoryId });
  },

  uploadItemImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/api/admin/upload-image", {
      method: "POST",
      body: form,
      headers: {}, // Let browser set multipart boundary
    });
  },

  // ── Tables ──────────────────────────────────────────────────────────────────

  createTable(label: string, seats: number): Promise<ApiResponse<Table>> {
    return post("/api/admin/crud", { type: "create_table", label, seats });
  },

  deleteTable(tableId: string): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/admin/crud", { type: "delete_table", tableId });
  },

  // ── Settings ────────────────────────────────────────────────────────────────

  updateSettings(payload: {
    name?: string;
    taxRate?: number;
    phone?: string;
    address?: string;
    gstin?: string;
    upiId?: string;
    upiQrUrl?: string;
    accentColor?: string;
    logoUrl?: string;
    googleReviewUrl?: string;
  }): Promise<ApiResponse<Restaurant>> {
    return post("/api/admin/crud", { type: "update_settings", ...payload });
  },

  // ── Analytics ───────────────────────────────────────────────────────────────

  fetchAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    return request<AnalyticsData>("/api/analytics");
  },

  // ── Feedback ────────────────────────────────────────────────────────────────

  submitFeedback(payload: {
    statusToken: string;
    rating: number;
    feedback?: string;
    compliments?: string[];
  }): Promise<ApiResponse<{ success: boolean }>> {
    return post("/api/feedback", {
      status_token: payload.statusToken,
      rating: payload.rating,
      feedback: payload.feedback,
      compliments: payload.compliments,
    });
  },

  // ── Shift / Z-Report ────────────────────────────────────────────────────────

  closeShift(): Promise<ApiResponse<{ report: unknown }>> {
    return post("/api/admin/crud", { type: "close_shift" });
  },
};
