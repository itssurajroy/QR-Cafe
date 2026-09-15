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
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2.5 shadow-md border-b border-amber-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider bg-amber-950 text-amber-100 px-2 py-0.5 rounded-md">
              🕵️ Live Impersonation
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-400/60 text-amber-950 border border-amber-600/30">
              {tenantName}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-mono text-amber-900 bg-amber-400/40">
              /c/{tenantSlug}
            </span>
            {remainingMs !== null && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                  expired
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                ⏳ {expired ? "Session elapsed" : `${formatRemaining(remainingMs)} remaining`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="px-3 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-950 text-xs font-bold border border-amber-700/20 cursor-pointer transition-all"
            >
              Copy Session Link
            </button>
            <button
              type="button"
              onClick={handleExit}
              disabled={exiting}
              className="px-3 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-white text-xs font-bold shadow cursor-pointer transition-all disabled:opacity-50"
            >
              {exiting ? "Exiting…" : "✕ Exit Session"}
            </button>
          </div>
        </div>
      </div>

      {children && <div className="pt-12">{children}</div>}
    </>
  );
}

export const ImpersonationBanner = ImpersonationBar;
