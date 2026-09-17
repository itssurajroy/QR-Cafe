// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

/**
 * SWUpdateToast — prompts the user when a new service worker is waiting.
 * Mounted once from the root layout.
 */
import { useSWUpdate } from "@/hooks/useSWUpdate";

export function SWUpdateToast() {
  const { updateAvailable, reload } = useSWUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#5738F5]/20 bg-white p-4 shadow-xl shadow-[#5738F5]/10 dark:bg-stone-900"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-[#17142B] dark:text-stone-100">
            A new version of QRslice is ready
          </p>
          <p className="text-xs text-slate-500 dark:text-stone-400">
            Update now to get the latest fixes and features.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="shrink-0 rounded-xl bg-[#5738F5] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4729d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5738F5]"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
