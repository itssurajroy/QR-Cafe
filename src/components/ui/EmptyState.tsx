// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-10 text-center bg-white border border-[#E7E4F0] rounded-3xl space-y-4 max-w-lg mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#EEEAFE] text-[#5738F5] flex items-center justify-center mx-auto text-2xl shadow-xs">
        {icon || "🍽️"}
      </div>
      <div>
        <h3 className="text-base font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h3>
        <p className="text-xs text-[#6F7185] mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAction}
            className="px-5 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs shadow-md shadow-[#5738F5]/20 cursor-pointer active:scale-98 transition-all"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

