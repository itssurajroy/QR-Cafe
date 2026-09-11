"use client";

/**
 * QRslice — Global Toast Notification System
 * Replaces the per-component `setMsg()` flash state in AdminClient.
 *
 * Usage:
 *   1. Wrap app in <ToastProvider> in layout.tsx
 *   2. In any component: const { toast } = useToast();
 *      toast.success("Settings saved!")
 *      toast.error("Network error")
 *      toast.info("Order updated")
 */

import { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = String(++idRef.current);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    info: (msg: string) => addToast(msg, "info"),
    warning: (msg: string) => addToast(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Render Layer */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            } />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastVariant, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  error:   "bg-red-50 border-red-200 text-red-700",
  info:    "bg-slate-100 border-slate-200 text-slate-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
};

const TOAST_ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error:   "⚠️",
  info:    "ℹ",
  warning: "⚠",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border
        shadow-xl backdrop-blur-xl text-xs font-bold min-w-64 max-w-xs
        animate-slide-in-bottom
        ${TOAST_STYLES[toast.variant]}
      `}
    >
      <span className="shrink-0 text-sm">{TOAST_ICONS[toast.variant]}</span>
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer text-xs"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}