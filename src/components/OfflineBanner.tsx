// Copyright (c) 2026 QRslice. All rights reserved.
"use client";
import { useSyncExternalStore } from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

const emptySubscribe = () => () => {};

export default function OfflineBanner() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isOffline = useOfflineStatus();

  if (!isMounted || !isOffline) return null;
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-800 text-xs text-center py-2 px-4 font-bold no-print">
      Offline — your orders are queued and will sync when you’re back online.
    </div>
  );
}



