// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";

/**
 * OfflineRetryButton — client-side retry for the static /offline fallback page.
 */
export function OfflineRetryButton() {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    // If the SW serves this page while offline, reload re-triggers the
    // NetworkFirst navigation attempt; online users land back where they were.
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={retrying}
      className="inline-flex items-center justify-center rounded-xl bg-[#5738F5] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#5738F5]/25 transition hover:bg-[#4729d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5738F5] disabled:opacity-70"
    >
      {retrying ? "Retrying…" : "Try Again"}
    </button>
  );
}
