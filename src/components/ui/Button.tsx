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
    "bg-[#D97706] hover:bg-[#B45309] text-white shadow-md shadow-amber-500/20",
  ghost:
    "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-sm",
  danger:
    "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
  outline:
    "bg-transparent hover:bg-stone-50 text-stone-600 border border-stone-300",
  success:
    "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
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
