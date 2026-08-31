"use client";

/**
 * useLiveRevenue — Admin live revenue ticker (30s refresh)
 * Extracted from AdminClient.tsx
 */

import { useState, useEffect } from "react";
import type { AnalyticsData, Order } from "@/types";

export interface UseLiveRevenueReturn {
  liveRevenue: number;
  liveOrders: number;
  recentOrders: Partial<Order>[];
}

export function useLiveRevenue(
  initialRevenue = 0,
  initialOrders = 0,
  intervalMs = 30000,
): UseLiveRevenueReturn {
  const [liveRevenue, setLiveRevenue] = useState(initialRevenue);
  const [liveOrders, setLiveOrders] = useState(initialOrders);
  const [recentOrders, setRecentOrders] = useState<Partial<Order>[]>([]);

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) return;
        const d: AnalyticsData = await res.json();
        if (d.today) {
          setLiveRevenue(d.today.revenue ?? initialRevenue);
          setLiveOrders(d.today.orders ?? initialOrders);
        }
        if (d.recentOrders) {
          setRecentOrders(d.recentOrders.slice(0, 10));
        }
      } catch {
        // Network failure — keep last known values
      }
    }

    fetchLive();
    const ticker = setInterval(fetchLive, intervalMs);
    return () => clearInterval(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { liveRevenue, liveOrders, recentOrders };
}
