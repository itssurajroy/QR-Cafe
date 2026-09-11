import React from "react";

interface QrSliceLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  inverted?: boolean;
}

export function QrSliceIcon({ className = "w-8 h-8", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="QrSlice Logo Mark"
    >
      {/* Base stylized rounded Q body */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill={inverted ? "#FFFFFF" : "#5738F5"}
      />
      {/* Top-left QR module */}
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="3"
        fill={inverted ? "#5738F5" : "#FFFFFF"}
      />
      <rect
        x="12"
        y="12"
        width="5"
        height="5"
        rx="1"
        fill={inverted ? "#FFFFFF" : "#5738F5"}
      />
      {/* Top-right QR module */}
      <rect
        x="28"
        y="9"
        width="11"
        height="11"
        rx="3"
        fill={inverted ? "#5738F5" : "#FFFFFF"}
      />
      <rect
        x="31"
        y="12"
        width="5"
        height="5"
        rx="1"
        fill={inverted ? "#FFFFFF" : "#5738F5"}
      />
      {/* Bottom-left QR module */}
      <rect
        x="9"
        y="28"
        width="11"
        height="11"
        rx="3"
        fill={inverted ? "#5738F5" : "#FFFFFF"}
      />
      <rect
        x="12"
        y="31"
        width="5"
        height="5"
        rx="1"
        fill={inverted ? "#FFFFFF" : "#5738F5"}
      />
      {/* Center data dot */}
      <circle
        cx="24"
        cy="24"
        r="3"
        fill={inverted ? "#5738F5" : "#FFFFFF"}
      />
      {/* Lower-right "Slice" cursor geometry */}
      <path
        d="M27 27L42 36L34 38L39 45L35 47L30 40L24 43L27 27Z"
        fill="#FFFFFF"
        stroke={inverted ? "#5738F5" : "#4328D9"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Subtle lavender slice glow */}
      <circle cx="34" cy="34" r="2.5" fill="#EEEAFE" />
    </svg>
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

  const textSizes = {
    sm: "text-base tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl tracking-tight",
    xl: "text-3xl tracking-tight",
  };

  if (variant === "icon") {
    return <QrSliceIcon className={`${iconSizes[size]} ${className}`} inverted={inverted} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 font-sans select-none ${className}`}>
      <QrSliceIcon className={iconSizes[size]} inverted={inverted} />
        <div className="flex items-baseline">
          <span
            className={`font-black ${textSizes[size]} ${
              inverted ? "text-white" : "text-[#17142B]"
            }`}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Qr<span className="text-[#5738F5]">Slice</span>
          </span>
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#5738F5] inline-block" />
        </div>
    </div>
  );
}
