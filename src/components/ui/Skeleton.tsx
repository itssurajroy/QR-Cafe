// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-white/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-white border border-[#E7E4F0] space-y-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        ))}
      </div>

      {/* Pipeline skeleton */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7E4F0] space-y-4">
        <Skeleton className="w-48 h-5" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

