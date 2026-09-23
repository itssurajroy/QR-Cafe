"use client";
import React, { useState, useEffect } from "react";

export function InstallPwaButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    if (isIosDevice && !(window.navigator as any).standalone) {
      setIsIOS(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert(
        "To install on your iPhone:\n1. Tap the Share icon at the bottom of Safari.\n2. Tap 'Add to Home Screen'."
      );
    }
  };

  if (isStandalone) return null;
  // If not iOS and no prompt available, browser might not support it yet.
  if (!deferredPrompt && !isIOS) return null;

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className={`flex items-center gap-1.5 cursor-pointer ${className}`}
      title="Install App"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>Install App</span>
    </button>
  );
}
