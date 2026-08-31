"use client";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
export default function OfflineBanner() {
  const isOffline = useOfflineStatus();
  if (!isOffline) return null;
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-2 px-4 font-medium">
      Offline — your orders are queued and will sync when you’re back online.
    </div>
  );
}
