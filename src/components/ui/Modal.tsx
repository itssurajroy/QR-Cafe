"use client";

/**
 * QRslice UI Library — Modal
 * Two variants: dialog (centered overlay) and bottom-sheet (slides up from bottom)
 * Uses React portal for proper z-index stacking.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  mode?: "dialog" | "bottom-sheet";
  title?: string;
  subtitle?: string;
  /** Max width for dialog mode */
  maxWidth?: "xs" | "sm" | "md" | "lg";
  children: React.ReactNode;
  /** Show the X close button in top-right */
  showClose?: boolean;
}

const MAX_WIDTHS: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onClose,
  mode = "dialog",
  title,
  subtitle,
  maxWidth = "sm",
  showClose = true,
  children,
}: ModalProps) {
  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const content =
    mode === "bottom-sheet" ? (
      // Bottom Sheet
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div
          className={`w-full ${MAX_WIDTHS[maxWidth]} bg-white border border-slate-200 rounded-t-3xl p-5 shadow-2xl animate-slide-in-bottom`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
          {(title || showClose) && (
            <div className="flex items-center justify-between mb-4">
              <div>
                {title && (
                  <h3
                    className="font-black text-slate-900 text-base"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    ) : (
      // Centered Dialog
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className={`w-full ${MAX_WIDTHS[maxWidth]} bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl animate-fade-in-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between mb-4">
              <div>
                {title && (
                  <h3
                    className="font-black text-slate-900 text-base"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-xs flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    );

  // Use portal to render outside component tree
  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}