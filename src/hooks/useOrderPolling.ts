// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

/**
 * useOrderPolling — Live order status polling with retry and sound notification
 * Extracted from order/[statusToken]/page.tsx
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { Order } from "@/types";
import { useAudioTone } from "./useAudioTone";

export interface UseOrderPollingReturn {
  data: Order | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

export function useOrderPolling(
  token: string,
  intervalMs = 1500,
  maxRetries = 4,
): UseOrderPollingReturn {
  const [data, setData] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);
  const prevStatus = useRef<string | null>(null);
  const { playAudioTone } = useAudioTone();

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/order-status/${token}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) {
        // Fire sound on status change
        if (prevStatus.current && prevStatus.current !== json.status) {
          playAudioTone("statusChange");
        }
        prevStatus.current = json.status;
        setData(json as Order);
        setError(null);
        retryCount.current = 0;
      } else {
        retryCount.current += 1;
        if (retryCount.current >= maxRetries) {
          setError(json.error ?? "Order not found");
        }
      }
    } catch {
      retryCount.current += 1;
      if (retryCount.current >= maxRetries) {
        setError("Network error — could not reach server");
      }
    }
  }, [token, maxRetries, playAudioTone]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll().finally(() => setLoading(false));
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [token, intervalMs, poll]);

  return { data, error, loading, refetch: poll };
}

