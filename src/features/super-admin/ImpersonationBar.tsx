// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useRouter } from "next/navigation";

export interface ImpersonationBarProps {
  tenantName: string;
  tenantSlug: string;
  onExit?: () => void;
  children?: React.ReactNode;
  expiresAt?: string | null;
  cafeId?: string | null;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ImpersonationBar({
  tenantName,
  tenantSlug,
  onExit,
  children,
  expiresAt = null,
  cafeId = null,
}: ImpersonationBarProps) {
  const router = useRouter();
  const [now, setNow] = React.useState(() => Date.now());
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const remainingMs = expiresAt ? new Date(expiresAt).getTime() - now : null;
  const expired = remainingMs !== null && remainingMs <= 0;

  const handleExit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      if (cafeId) {
        await fetch("/api/super/impersonate", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cafeId }),
        }).catch(() => null);
      }
    } finally {
      setExiting(false);
      if (onExit) {
        onExit();
      } else {
        router.push("/super");
      }
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-stone-950 px-4 py-2 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black">🕵️‍♂️ IMPERSONATING</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-950 font-bold border border-amber-500/30">
              {tenantName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-950 border border-amber-500/30">
              {tenantSlug}
            </span>
            <span className="text-xs text-amber-950/80 font-medium">Viewing in live owner mode</span>
            {remainingMs !== null && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-black border ${
                  expired
                    ? "bg-red-600 text-white border-red-700"
                    : "bg-stone-950 text-amber-400 border-stone-950"
                }`}
                title="Advisory reminder only — session does not auto-revoke. Exit when done."
              >
                ⏳ {expired ? "Reminder elapsed — exit when done" : `${formatRemaining(remainingMs)} reminder — exit when done`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-stone-950 text-xs font-bold border border-stone-950/20 cursor-pointer transition-all active:scale-95"
            >
              <span className="text-xs font-bold">📋 Copy URL</span>
            </button>
            <button
              type="button"
              onClick={handleExit}
              disabled={exiting}
              className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {exiting ? "Exiting…" : "✕ Exit Impersonation"}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 shadow-xl flex items-center gap-2 max-w-sm animate-slide-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-800">Live Impersonation Active</span>
          </div>
          <span className="text-xs text-amber-800/80">
            {remainingMs !== null ? `Advisory session — exit when done (${formatRemaining(remainingMs)} reminder)` : "Advisory session — exit when done to return to admin"}
          </span>
        </div>
      </div>

      {children && <div className="pt-12">{children}</div>}
    </>
  );
}

export const ImpersonationBanner = ImpersonationBar;
