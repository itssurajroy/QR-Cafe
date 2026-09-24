// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import { useEffect, useState } from "react";

export default function GlobalLoading() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Only show the spinner if loading takes more than 300ms to prevent flashing on fast navigations
    const timer = setTimeout(() => setShowSpinner(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-stone-950 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="animate-pulse scale-125">
          <QrSliceLogo size="lg" />
        </div>
        
        {/* Skeleton UI blocks simulating the UI structure */}
        <div className="w-full max-w-sm space-y-4 px-6 opacity-60">
          <div className="h-24 w-full bg-slate-100 dark:bg-stone-900 rounded-3xl skeleton"></div>
          <div className="space-y-3">
            <div className="h-12 w-full bg-slate-100 dark:bg-stone-900 rounded-2xl skeleton" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-12 w-full bg-slate-100 dark:bg-stone-900 rounded-2xl skeleton" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-12 w-full bg-slate-100 dark:bg-stone-900 rounded-2xl skeleton" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>

        {/* Fallback subtle spinner for slow networks */}
        <div className={`mt-8 transition-opacity duration-500 ${showSpinner ? "opacity-100" : "opacity-0"}`}>
          <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Syncing...</p>
        </div>
      </div>
    </div>
  );
}
