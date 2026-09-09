// src/wa/notifications.ts
import { getSocket } from "./socket";
import { generateBillPdfBuffer } from "@/lib/bill-pdf";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { BillPayload } from "./types";

const STATUS_MESSAGES: Record<string, (orderNumber: string) => string> = {
  confirmed: (n) => `✅ Order #${n} confirmed! Preparing your food.`,
  preparing: (n) => `👨‍🍳 Order #${n} is being prepared.`,
  ready: (n) => `🔔 Order #${n} is ready! Please collect from the counter.`,
};

export async function emitWhatsAppNotification(
  orderId: string,
  status: string
): Promise<void> {
  try {
    const db = createSupabaseAdmin();

    // Load order with restaurant and items
    const { data: order } = await db
      .from("orders")
      .select(`
        id, order_number, status, total_paise, subtotal_paise, discount_paise,
        payment_status, payment_method, customer_phone, created_at,
        restaurant:restaurants(id, name, address, phone, gstin, whatsapp_enabled, plan),
        table:restaurant_tables(label),
        items:order_items(item_name, quantity, unit_price_paise)
      `)
      .eq("id", orderId)
      .single();

    if (!order) return;

    const restaurant = order.restaurant as any;
    if (!restaurant?.whatsapp_enabled) return;

    // Tier gating: notifications require starter+
    const allowedPlans = ["starter", "growth", "pro"];
    if (!allowedPlans.includes(restaurant.plan)) return;

    // Need customer phone to send
    if (!order.customer_phone) return;

    const cafeSocket = getSocket(restaurant.id);
    if (!cafeSocket?.connected) return;

    const phoneJid = normalizePhoneJid(order.customer_phone);

    // Status text message
    const messageFn = STATUS_MESSAGES[status];
    if (messageFn) {
      await cafeSocket.socket.sendMessage(phoneJid, {
        text: messageFn(order.order_number),
      });
    }

    // Bill PDF on served
    if (status === "served") {
      const billPayload: BillPayload = {
        restaurant: {
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          gstin: restaurant.gstin,
        },
        order: {
          order_number: order.order_number,
          table_label: order.table?.[0]?.label || "",
          created_at: order.created_at,
          total_paise: order.total_paise,
          subtotal_paise: order.subtotal_paise,
          discount_paise: order.discount_paise,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
        },
        items: order.items || [],
      };

      const pdfBuffer = await generateBillPdfBuffer(billPayload);
      const totalRupees = (order.total_paise / 100).toFixed(0);

      await cafeSocket.socket.sendMessage(phoneJid, {
        document: pdfBuffer,
        mimetype: "application/pdf",
        fileName: `bill-${order.order_number}.pdf`,
        caption: `Your bill for Order #${order.order_number} — ₹${totalRupees}`,
      });
    }
  } catch (err) {
    console.error(`[WA] Notification failed for order ${orderId}:`, err);
  }
}

function normalizePhoneJid(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}
