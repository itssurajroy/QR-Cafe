// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { OfflineRetryButton } from "@/components/pwa/OfflineRetryButton";

export const metadata: Metadata = {
  title: "You're Offline",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * /offline — static fallback served by the service worker when a navigation
 * fails (NetworkFirst miss + no cached page). Kept dependency-light so the
 * precached copy always renders.
 */
export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 font-[family-name:var(--font-plus-jakarta)] flex items-center justify-center p-6 selection:bg-[#5738F5] selection:text-white">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5738F5]/10">
          <WifiOff className="h-7 w-7 text-[#5738F5]" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">You&apos;re Offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Looks like you lost your connection. Check your network and try again —
          any orders you placed are safely queued and will sync when you&apos;re
          back online.
        </p>
        <div className="mt-6">
          <OfflineRetryButton />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400">
          QRslice works offline — we&apos;ll reconnect you automatically.
        </p>
      </div>
    </main>
  );
}
