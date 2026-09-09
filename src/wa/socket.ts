// src/wa/socket.ts
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import path from "path";
import fs from "fs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { CafeSocket } from "./types";

const logger = P({ level: "silent" });
const sockets = new Map<string, CafeSocket>();

const AUTH_BASE_DIR = path.join(process.cwd(), "whatsapp_auth");

export function getSocket(restaurantId: string): CafeSocket | undefined {
  return sockets.get(restaurantId);
}

export async function connectAllCafes(): Promise<Map<string, CafeSocket>> {
  const db = createSupabaseAdmin();
  const { data: sessions } = await db
    .from("whatsapp_sessions")
    .select("restaurant_id, phone_number, connected");

  if (!sessions) return sockets;

  for (const session of sessions) {
    if (!session.phone_number) continue;
    try {
      await connectCafe(session.restaurant_id, session.phone_number);
    } catch (err) {
      console.error(`[WA] Failed to connect café ${session.restaurant_id}:`, err);
    }
  }

  return sockets;
}

async function connectCafe(restaurantId: string, phoneNumber: string): Promise<CafeSocket> {
  const authDir = path.join(AUTH_BASE_DIR, restaurantId);
  fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await import("@whiskeysockets/baileys").then((m) =>
    m.fetchLatestBaileysVersion()
  );

  const socket = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.macOS("QR Café"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  const cafeSocket: CafeSocket = {
    restaurantId,
    phoneNumber,
    socket,
    connected: false,
  };

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`[WA] QR code for café ${restaurantId} — scan with WhatsApp`);
    }

    if (connection === "close") {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      cafeSocket.connected = false;
      await updateSessionStatus(restaurantId, false);

      if (shouldReconnect) {
        console.log(`[WA] Reconnecting café ${restaurantId}...`);
        setTimeout(() => connectCafe(restaurantId, phoneNumber), 3000);
      } else {
        console.log(`[WA] Café ${restaurantId} logged out — needs re-scan`);
      }
    } else if (connection === "open") {
      cafeSocket.connected = true;
      await updateSessionStatus(restaurantId, true);
      console.log(`[WA] Connected: café ${restaurantId}`);
    }
  });

  socket.ev.on("creds.update", saveCreds);

  sockets.set(restaurantId, cafeSocket);
  return cafeSocket;
}

async function updateSessionStatus(restaurantId: string, connected: boolean): Promise<void> {
  const db = createSupabaseAdmin();
  await db
    .from("whatsapp_sessions")
    .update({
      connected,
      last_connected_at: connected ? new Date().toISOString() : null,
    })
    .eq("restaurant_id", restaurantId);
}
