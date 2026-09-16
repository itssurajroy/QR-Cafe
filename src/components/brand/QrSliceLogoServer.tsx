// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";

interface QrSliceLogoServerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  inverted?: boolean;
}

const iconSizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const logoSizes = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
  xl: "h-12",
};

/**
 * QRslice Icon - Server-compatible version
 */
export function QrSliceIconServer({ 
  className = "w-8 h-8", 
  inverted = false 
}: { className?: string; inverted?: boolean }) {
  const bgColor = inverted ? "white" : "#5738F5";
  const iconColor = inverted ? "#5738F5" : "white";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="QRslice"
    >
      <rect width="32" height="32" rx="8" fill={bgColor} />
      <path
        d="M8 24L12 14L16 20L20 10L24 24"
        stroke={iconColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * QRslice Wordmark - Server-compatible version
 */
export function QrSliceWordmarkServer({ 
  className = "", 
  size = "md",
  inverted = false 
}: { className?: string; size?: "sm" | "md" | "lg" | "xl"; inverted?: boolean }) {
  const textColor = inverted ? "white" : "#5738F5";
  const sizeClass = { sm: "h-6", md: "h-8", lg: "h-10", xl: "h-12" }[size];

  return (
    <svg
      viewBox="0 0 120 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${className}`}
      role="img"
      aria-label="QRslice"
    >
      <text
        x="0"
        y="18"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill={textColor}
        letterSpacing="-0.5"
      >
        QRslice
      </text>
    </svg>
  );
}

/**
 * QRslice Full Logo - Server-compatible version
 */
export function QrSliceLogoServer({
  className = "",
  size = "md",
  variant = "full",
  inverted = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  inverted?: boolean;
}) {
  const gap = size === "sm" ? "2" : size === "lg" ? "4" : "3";

  if (variant === "icon") {
    return <QrSliceIconServer className={{ sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10", xl: "w-12 h-12" }[size]} inverted={inverted} />;
  }

  if (variant === "wordmark") {
    return <QrSliceWordmarkServer className={className} size={size} inverted={inverted} />;
  }

  return (
    <div className={`flex items-center gap-${size === "sm" ? "2" : size === "lg" ? "4" : "3"} ${className}`} role="img" aria-label="QRslice">
      <QrSliceIconServer className={{ sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10", xl: "w-12 h-12" }[size]} inverted={inverted} />
      <QrSliceWordmarkServer size={size} inverted={inverted} />
    </div>
  );
}