/**
 * QR Café UI Library — Button
 * Reusable button replacing all inline amber/stone button Tailwind classes.
 */

import { forwardRef } from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-black rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 shadow-md shadow-amber-500/25",
  ghost:
    "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700",
  danger:
    "bg-red-950 hover:bg-red-900 text-red-300 border border-red-800",
  outline:
    "bg-transparent hover:bg-stone-900 text-stone-300 border border-stone-700",
  success:
    "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "px-2.5 py-1 text-[10px]",
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-4 py-2.5 text-xs",
  lg: "px-6 py-3.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
