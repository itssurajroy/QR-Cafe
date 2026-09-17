// Copyright (c) 2026 QRslice. All rights reserved.
// server-only guard - only enforce in Next.js server runtime
try {
  if (process.env.NEXT_RUNTIME) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("server-only");
  }
} catch {}
import makeWASocket, { WASocket, ConnectionState, AuthenticationState, SignalDataTypeMap, BaileysEventMap } from "@whiskeysockets/baileys";
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

function createLogger(tenantId: string): ILogger {
  const isDev = process.env.NODE_ENV !== "production";
  const prefix = `[WhatsApp:${tenantId}]`;

  const log = (level: "trace" | "debug" | "info" | "warn" | "error", ...args: unknown[]) => {
    if (isDev || level === "warn" || level === "error") {
      const method = console[level] ?? console.log;
      method(`${prefix} [${level.toUpperCase()}]`, ...args);
    }
  };

  const logger: ILogger = {
    level: isDev ? "debug" : "warn",
    trace: (...args) => log("trace", ...args),
    debug: (...args) => log("debug", ...args),
    info: (...args) => log("info", ...args),
    warn: (...args) => log("warn", ...args),
    error: (...args) => log("error", ...args),
    child: (bindings) => {
      const childPrefix = `${prefix} ${JSON.stringify(bindings)}`;
      return {
        ...logger,
        trace: (...args) => log("trace", childPrefix, ...args),
        debug: (...args) => log("debug", childPrefix, ...args),
        info: (...args) => log("info", childPrefix, ...args),
        warn: (...args) => log("warn", childPrefix, ...args),
        error: (...args) => log("error", childPrefix, ...args),
      };
    },
  };
  return logger;
}

function validateTenantId(tenantId: string): void {
  if (!tenantId || typeof tenantId !== "string" || tenantId.trim().length === 0) {
    throw new Error("Invalid tenantId: must be a non-empty string");
  }
}

interface ConnectionData {
  socket: WASocket;
  eventHandlers: Array<{ event: keyof BaileysEventMap; handler: (...args: unknown[]) => void }>;
  reconnectTimeout: NodeJS.Timeout | null;
}

export class BaileysConnectionManager {
  private connections = new Map<string, ConnectionData>();
  private sessionStore = new BaileysSessionStore();
  private qrCodes = new Map<string, string>();

  async connect(tenantId: string): Promise<void> {
    validateTenantId(tenantId);

    if (this.connections.has(tenantId)) {
      return;
    }

    const storedAuthState = await this.sessionStore.getAuthState(tenantId);
    const authState = storedAuthState || createDefaultAuthState();

    const socket = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      logger: createLogger(tenantId),
    });

    const eventHandlers: ConnectionData["eventHandlers"] = [];

    const connectionUpdateHandler = (update: Partial<ConnectionState>) => {
      this.handleConnectionUpdate(tenantId, update);
    };
    socket.ev.on("connection.update", connectionUpdateHandler);
    eventHandlers.push({ event: "connection.update", handler: connectionUpdateHandler as (...args: unknown[]) => void });

    const credsUpdateHandler = async () => {
      await this.handleCredsUpdate(tenantId, socket.authState);
    };
    socket.ev.on("creds.update", credsUpdateHandler);
    eventHandlers.push({ event: "creds.update", handler: credsUpdateHandler as (...args: unknown[]) => void });

    const messagesUpsertHandler = ({ messages }: { messages: unknown[] }) => {
      this.handleMessagesUpsert(tenantId, messages);
    };
    socket.ev.on("messages.upsert", messagesUpsertHandler);
    eventHandlers.push({ event: "messages.upsert", handler: messagesUpsertHandler as (...args: unknown[]) => void });

    this.connections.set(tenantId, {
      socket,
      eventHandlers,
      reconnectTimeout: null,
    });
  }

  async disconnect(tenantId: string): Promise<void> {
    validateTenantId(tenantId);

    const connectionData = this.connections.get(tenantId);
    if (connectionData) {
      if (connectionData.reconnectTimeout) {
        clearTimeout(connectionData.reconnectTimeout);
        connectionData.reconnectTimeout = null;
      }

      for (const { event, handler } of connectionData.eventHandlers) {
        connectionData.socket.ev.off(event, handler);
      }
      connectionData.eventHandlers.length = 0;

      await connectionData.socket.logout();
      this.connections.delete(tenantId);
      this.qrCodes.delete(tenantId);
    }
  }

  async getStatus(tenantId: string): Promise<WhatsAppStatus> {
    validateTenantId(tenantId);

    const connectionData = this.connections.get(tenantId);
    if (!connectionData) {
      return { connected: false };
    }

    const user = connectionData.socket.user;
    return {
      connected: true,
      phoneNumber: user?.id?.split(":")[0] || undefined,
      lastSeen: new Date().toISOString(),
      qrCode: this.qrCodes.get(tenantId) || undefined,
    };
  }

  async getQRCode(tenantId: string): Promise<string | null> {
    validateTenantId(tenantId);
    return this.qrCodes.get(tenantId) || null;
  }

  getSocket(tenantId: string): WASocket | undefined {
    validateTenantId(tenantId);
    return this.connections.get(tenantId)?.socket;
  }

  private handleConnectionUpdate(tenantId: string, update: Partial<ConnectionState>): void {
    if (update.qr) {
      this.qrCodes.set(tenantId, update.qr);
    }

    if (update.connection === "open") {
      this.qrCodes.delete(tenantId);
    }

    if (update.connection === "close") {
      const connectionData = this.connections.get(tenantId);
      const shouldReconnect = !update.lastDisconnect?.error ||
        (update.lastDisconnect.error as Boom).output?.statusCode !== 403;

      this.connections.delete(tenantId);
      this.qrCodes.delete(tenantId);

      if (shouldReconnect) {
        const timeout = setTimeout(() => this.connect(tenantId), 5000);
        if (connectionData) {
          connectionData.reconnectTimeout = timeout;
        }
      }
    }
  }

  private async handleCredsUpdate(tenantId: string, authState: AuthenticationState): Promise<void> {
    try {
      await this.sessionStore.saveAuthState(tenantId, authState);
    } catch (error) {
      console.error(`[WhatsApp:${tenantId}] Failed to save auth state:`, error);
    }
  }

  private handleMessagesUpsert(tenantId: string, messages: unknown[]): void {
    console.log(`[WhatsApp:${tenantId}] Received ${messages.length} message(s)`);
  }
}
