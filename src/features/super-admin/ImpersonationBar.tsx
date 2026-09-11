"use client";

import React from "react";
import { useRouter } from "next/navigation";

export interface ImpersonationBarProps {
  tenantName: string;
  tenantSlug: string;
  onExit: () => void;
  children?: React.ReactNode;
}

export function ImpersonationBar({
  tenantName,
  tenantSlug,
  onExit,
  children,
}: ImpersonationBarProps) {
  const router = useRouter();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-stone-950 px-4 py-2 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black">🕵️‍♂️ IMPERSONATING</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-900 font-bold border border-amber-500/30">
              {tenantName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30">
              {tenantSlug}
            </span>
            <span className="text-xs text-amber-800/80">You are viewing as this tenant</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/20 cursor-pointer transition-all active:scale-95"
            >
              <span className="text-sm">📋</span>
              <span className="text-xs font-bold">Copy URL</span>
            </button>
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/20 cursor-pointer transition-all active:scale-95"
            >
              Exit Impersonation →
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
          <span className="text-xs text-amber-800/80">Exit impersonation to return to admin</span>
        </div>
      </div>

      {children && <div className="pt-12">{children}</div>}
    </>
  );
}

export const ImpersonationBanner = ImpersonationBar;