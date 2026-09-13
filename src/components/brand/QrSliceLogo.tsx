// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";

interface QrSliceLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  inverted?: boolean;
}

export function QrSliceIcon({ className = "w-8 h-8", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
<img 
      src="/favicon.png" 
      alt="QRslice Icon" 
      className={`object-contain ${className}`}
    />
  );
}

export function QrSliceLogo({
  className = "",
  size = "md",
  variant = "full",
  inverted = false,
}: QrSliceLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  if (variant === "icon") {
    return <QrSliceIcon className={`${iconSizes[size]} ${className}`} inverted={inverted} />;
  }

return (
    <img 
      src="/logo.png" 
      alt="QRslice Logo" 
      className={`object-contain ${sizeClasses[size]} ${className}`}
    />
  );
}

