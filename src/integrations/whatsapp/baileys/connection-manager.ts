// Copyright (c) 2026 QRslice. All rights reserved.
// server-only guard - only enforce in Next.js server runtime
try {
  if (process.env.NEXT_RUNTIME) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("server-only");
  }
} catch {}
import makeWASocket, { WASocket, ConnectionState, AuthenticationState, SignalDataTypeMap } from "@whiskeysockets/baileys";
import { initAuthCreds } from "@whiskeysockets/baileys/lib/Utils/auth-utils";
import { BaileysSessionStore } from "./session-store";
import { Boom } from "@hapi/boom";
import type { WhatsAppStatus } from "@/integrations/whatsapp/whatsapp.types";
import type { ILogger } from "@whiskeysockets/baileys/lib/Utils/logger";

function createInMemoryKeyStore(): AuthenticationState["keys"] {
  const store = new Map<keyof SignalDataTypeMap, Map<string, unknown>>();

  return {
    get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
      const category = store.get(type) || new Map();
      const result: Record<string, unknown> = {};
      for (const id of ids) {
        result[id] = category.get(id) ?? null;
      }
      return result as Record<string, SignalDataTypeMap[T]>;
    },
    set: async (data: { [T in keyof SignalDataTypeMap]?: Record<string, SignalDataTypeMap[T] | null> }) => {
      for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
        if (!store.has(category)) {
          store.set(category, new Map());
        }
        const catStore = store.get(category)!;
        const categoryData = data[category];
        if (categoryData) {
          for (const id of Object.keys(categoryData)) {
            const value = categoryData[id];
            if (value === null) {
              catStore.delete(id);
            } else {
              catStore.set(id, value);
            }
          }
        }
      }
    },
    clear: async () => {
      store.clear();
    },
  };
}

function createDefaultAuthState(): AuthenticationState {
  return {
    creds: initAuthCreds(),
    keys: createInMemoryKeyStore(),
  };
}

function createSilentLogger(): ILogger {
  const noop = () => {};
  const logger: ILogger = {
    level: "silent",
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => logger,
  };
  return logger;
}

export class BaileysConnectionManager {
  private connections = new Map<string, WASocket>();
  private sessionStore = new BaileysSessionStore();
  private qrCodes = new Map<string, string>();

  async connect(tenantId: string): Promise<void> {
    if (this.connections.has(tenantId)) {
      return;
    }

    const storedAuthState = await this.sessionStore.getAuthState(tenantId);
    const authState = storedAuthState || createDefaultAuthState();

    const socket = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      logger: createSilentLogger(),
    });

    this.connections.set(tenantId, socket);

    socket.ev.on("connection.update", (update: Partial<ConnectionState>) => {
      this.handleConnectionUpdate(tenantId, update);
    });

    socket.ev.on("creds.update", async () => {
      await this.handleCredsUpdate(tenantId, socket.authState);
    });

    socket.ev.on("messages.upsert", ({ messages }) => {
      this.handleMessagesUpsert(tenantId, messages);
    });
  }

  async disconnect(tenantId: string): Promise<void> {
    const socket = this.connections.get(tenantId);
    if (socket) {
      await socket.logout();
      this.connections.delete(tenantId);
      this.qrCodes.delete(tenantId);
    }
  }

  async getStatus(tenantId: string): Promise<WhatsAppStatus> {
    const socket = this.connections.get(tenantId);
    if (!socket) {
      return { connected: false };
    }

    const user = socket.user;
    return {
      connected: true,
      phoneNumber: user?.id?.split(":")[0] || undefined,
      lastSeen: new Date().toISOString(),
      qrCode: this.qrCodes.get(tenantId) || undefined,
    };
  }

  async getQRCode(tenantId: string): Promise<string | null> {
    return this.qrCodes.get(tenantId) || null;
  }

  private handleConnectionUpdate(tenantId: string, update: Partial<ConnectionState>): void {
    if (update.qr) {
      this.qrCodes.set(tenantId, update.qr);
    }

    if (update.connection === "open") {
      this.qrCodes.delete(tenantId);
    }

    if (update.connection === "close") {
      const shouldReconnect = !update.lastDisconnect?.error ||
        (update.lastDisconnect.error as Boom).output?.statusCode !== 403;

      this.connections.delete(tenantId);
      this.qrCodes.delete(tenantId);

      if (shouldReconnect) {
        setTimeout(() => this.connect(tenantId), 5000);
      }
    }
  }

  private async handleCredsUpdate(tenantId: string, authState: AuthenticationState): Promise<void> {
    try {
      await this.sessionStore.saveAuthState(tenantId, authState);
    } catch (error) {
      console.error(`Failed to save auth state for tenant ${tenantId}:`, error);
    }
  }

  private handleMessagesUpsert(tenantId: string, messages: any[]): void {
    // Handle incoming messages - can be extended for message processing
    console.log(`[${tenantId}] Received ${messages.length} message(s)`);
  }
}