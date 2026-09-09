// src/wa/messages.ts
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { CafeSocket } from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qr-cafe-blond.vercel.app";

export function setupInboundHandler(
  cafeSockets: Map<string, CafeSocket>
): void {
  for (const [restaurantId, cafeSocket] of cafeSockets) {
    const { socket } = cafeSocket;

    socket.ev.on("messages.upsert", async (event) => {
      if (event.type !== "notify") return;

      for (const msg of event.messages) {
        if (msg.key.fromMe) continue;
        await handleMessage(socket, restaurantId, msg);
      }
    });
  }
}

async function handleMessage(
  socket: WASocket,
  restaurantId: string,
  msg: WAMessage
): Promise<void> {
  const text =
    msg.message?.conversation?.toLowerCase() ||
    msg.message?.extendedTextMessage?.text?.toLowerCase() ||
    "";

  if (!text) return;

  const db = createSupabaseAdmin();

  // Check if restaurant has ordering enabled (growth+)
  const { data: restaurant } = await db
    .from("restaurants")
    .select("plan, whatsapp_enabled")
    .eq("id", restaurantId)
    .single();

  if (!restaurant?.whatsapp_enabled) return;

  const senderJid = msg.key.remoteJid;
  if (!senderJid) return;

  // Status lookup
  if (text.includes("status") || text.includes("order")) {
    await handleStatusLookup(socket, senderJid, restaurantId, msg);
    return;
  }

  // Menu link (growth+ only)
  const orderingPlans = ["growth", "pro"];
  if (orderingPlans.includes(restaurant.plan)) {
    await sendMenuLink(socket, senderJid, restaurantId);
    return;
  }

  // Free/starter: generic reply
  await socket.sendMessage(senderJid, {
    text: "Thank you for reaching out! For ordering, please visit our QR menu at the table.",
  });
}

async function sendMenuLink(
  socket: WASocket,
  senderJid: string,
  restaurantId: string
): Promise<void> {
  const db = createSupabaseAdmin();

  // Get the first active table's QR token for the menu link
  const { data: table } = await db
    .from("restaurant_tables")
    .select("qr_token")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .limit(1)
    .single();

  if (!table) {
    await socket.sendMessage(senderJid, {
      text: "Our menu is currently being updated. Please try again shortly!",
    });
    return;
  }

  const menuUrl = `${APP_URL}/t/${table.qr_token}`;
  await socket.sendMessage(senderJid, {
    text: `Browse our menu and place your order:\n${menuUrl}`,
  });
}

async function handleStatusLookup(
  socket: WASocket,
  senderJid: string,
  restaurantId: string,
  msg: WAMessage
): Promise<void> {
  const db = createSupabaseAdmin();

  // Extract phone number from sender JID
  const senderPhone = senderJid.split("@")[0];

  // Find most recent order for this phone number at this restaurant
  const { data: order } = await db
    .from("orders")
    .select("order_number, status, total_paise, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("customer_phone", senderPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!order) {
    await socket.sendMessage(senderJid, {
      text: "We couldn't find an order linked to your number. Please check your order number or place a new order via our QR menu.",
    });
    return;
  }

  const statusEmoji: Record<string, string> = {
    pending: "\u23f3",
    confirmed: "\u2705",
    preparing: "\ud83d\udc68\u200d\ud83c\udf73",
    ready: "\ud83d\udd14",
    served: "\u2714\ufe0f",
    cancelled: "\u274c",
    rejected: "\u274c",
  };

  const emoji = statusEmoji[order.status] || "\u2753";
  const totalRupees = (order.total_paise / 100).toFixed(0);

  await socket.sendMessage(senderJid, {
    text: `${emoji} Order #${order.order_number}\nStatus: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\nTotal: \u20b9${totalRupees}`,
  });
}
