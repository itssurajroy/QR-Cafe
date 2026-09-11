import React from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Your changes weren't saved. Please try again or check your network connection.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`p-8 text-center bg-white border border-rose-200 rounded-3xl space-y-4 max-w-md mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl">
        ⚠️
      </div>
      <div>
        <h3 className="text-base font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h3>
        <p className="text-xs text-[#6F7185] mt-1 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
          >
            Try Again ↻
          </button>
        </div>
      )}
    </div>
  );
}
