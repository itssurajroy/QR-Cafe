// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Offline-first order queue using IndexedDB.
 * Queues POS orders when offline, syncs automatically when online.
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface OfflineOrder {
  id: string;
  payload: unknown;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

interface OfflineDBSchema extends DBSchema {
  orders: {
    key: string;
    value: OfflineOrder;
    indexes: { "by-created": number };
  };
  syncStatus: {
    key: string;
    value: { key: string; lastSync: number; pendingCount: number };
  };
}

const DB_NAME = "qrslice-offline";
const DB_VERSION = 1;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const orderStore = db.createObjectStore("orders", { keyPath: "id" });
      orderStore.createIndex("by-created", "createdAt");

      db.createObjectStore("syncStatus", { keyPath: "key" });
    },
  });

  return dbInstance;
}

/**
 * Add an order to the offline queue
 */
export async function queueOrder(
  endpoint: string,
  payload: unknown,
  options: { method?: string; headers?: Record<string, string> } = {}
): Promise<string> {
  const db = await getDB();
  const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const order: OfflineOrder = {
    id,
    payload,
    endpoint,
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    createdAt: Date.now(),
    retryCount: 0,
  };

  await db.put("orders", order);
  await updateSyncStatus(db);

  return id;
}

/**
 * Process the offline queue - send all pending orders
 */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const db = await getDB();
  const orders = await db.getAllFromIndex("orders", "by-created");

  if (orders.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      const response = await fetch(order.endpoint, {
        method: order.method,
        headers: order.headers,
        body: JSON.stringify(order.payload),
      });

      if (response.ok) {
        await db.delete("orders", order.id);
        synced++;
      } else {
        // Server error - increment retry count
        order.retryCount++;
        order.lastError = `HTTP ${response.status}: ${await response.text()}`;

        if (order.retryCount >= MAX_RETRIES) {
          await db.delete("orders", order.id);
          failed++;
        } else {
          await db.put("orders", order);
          failed++;
        }
      }
    } catch (err) {
      // Network error - increment retry count
      order.retryCount++;
      order.lastError = err instanceof Error ? err.message : "Network error";

      if (order.retryCount >= MAX_RETRIES) {
        await db.delete("orders", order.id);
        failed++;
      } else {
        await db.put("orders", order);
        failed++;
      }
    }
  }

  await updateSyncStatus(db);
  return { synced, failed };
}

/**
 * Get pending order count
 */
export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count("orders");
}

/**
 * Get all pending orders for display
 */
export async function getPendingOrders(): Promise<OfflineOrder[]> {
  const db = await getDB();
  return db.getAllFromIndex("orders", "by-created");
}

/**
 * Clear all pending orders (use with caution)
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear("orders");
  await updateSyncStatus(db);
}

/**
 * Update sync status metadata
 */
async function updateSyncStatus(db: IDBPDatabase<OfflineDBSchema>): Promise<void> {
  const count = await db.count("orders");
  await db.put("syncStatus", { key: "main", lastSync: Date.now(), pendingCount: count });
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{ lastSync: number; pendingCount: number }> {
  const db = await getDB();
  const status = await db.get("syncStatus", "main");
  return status || { lastSync: 0, pendingCount: 0 };
}

/**
 * React hook for offline queue management
 */
import { useState, useEffect, useCallback } from "react";

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSync, setLastSync] = useState(0);

  const refresh = useCallback(async () => {
    const [count, status] = await Promise.all([getPendingCount(), getSyncStatus()]);
    setPendingCount(count);
    setLastSync(status.lastSync);
  }, []);

  useEffect(() => {
    refresh();

    // Listen for online event
    const handleOnline = () => {
      processQueue().then(refresh);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refresh]);

  const process = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await processQueue();
      await refresh();
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearQueue();
    await refresh();
  }, [refresh]);

  return {
    pendingCount,
    isProcessing,
    lastSync,
    process,
    clear,
    refresh,
  };
}

/**
 * Wrapper for POS order API that queues offline
 */
export async function submitOrderOnlineFirst(
  payload: unknown,
  options: { endpoint?: string; onOffline?: (id: string) => void } = {}
): Promise<{ success: boolean; online: boolean; orderId?: string }> {
  const endpoint = options.endpoint || "/api/pos/order";

  if (navigator.onLine) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json = await response.json();
        return { success: true, online: true, orderId: json.order?.id || json.id };
      }
    } catch {
      // Fall through to offline queue
    }
  }

  // Queue offline
  const id = await queueOrder(endpoint, payload);
  options.onOffline?.(id);
  return { success: true, online: false, orderId: id };
}