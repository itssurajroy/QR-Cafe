"use client";

/**
 * useCart — Cart state management hook
 * Extracted from MenuClient.tsx
 * Handles: add, remove, increase, decrease, clear, customization, session persistence
 */

import { useState, useCallback, useEffect } from "react";
import type { MenuItem, CartLine } from "@/types";

export interface UseCartReturn {
  cart: Record<string, CartLine>;
  cartLines: CartLine[];
  totalQty: number;
  totalPaise: number;
  addItem: (item: MenuItem, options?: { spiceLevel?: string; sizeVariant?: string; notes?: string }) => void;
  removeItem: (itemId: string) => void;
  increaseQty: (itemId: string) => void;
  decreaseQty: (itemId: string) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
}

export function useCart(storageKey: string): UseCartReturn {
  const [cart, setCart] = useState<Record<string, CartLine>>({});

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`cart:${storageKey}`);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(`cart:${storageKey}`, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart, storageKey]);

  const addItem = useCallback(
    (
      item: MenuItem,
      options?: { spiceLevel?: string; sizeVariant?: string; notes?: string },
    ) => {
      setCart((prev) => {
        const existing = prev[item.id];
        return {
          ...prev,
          [item.id]: {
            item,
            quantity: (existing?.quantity ?? 0) + 1,
            notes: options?.notes ?? existing?.notes ?? "",
            spiceLevel: options?.spiceLevel ?? existing?.spiceLevel,
            sizeVariant: options?.sizeVariant ?? existing?.sizeVariant,
          },
        };
      });
    },
    [],
  );

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const increaseQty = useCallback((itemId: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantity: prev[itemId].quantity + 1 },
      };
    });
  }, []);

  const decreaseQty = useCallback((itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...current, quantity: current.quantity - 1 },
      };
    });
  }, []);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return { ...prev, [itemId]: { ...prev[itemId], notes } };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const cartLines = Object.values(cart);
  const totalQty = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const totalPaise = cartLines.reduce(
    (sum, l) => sum + l.item.price_paise * l.quantity,
    0,
  );

  return {
    cart,
    cartLines,
    totalQty,
    totalPaise,
    addItem,
    removeItem,
    increaseQty,
    decreaseQty,
    updateNotes,
    clearCart,
  };
}
