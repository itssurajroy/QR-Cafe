// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice UI Library — Card
 * Light theme container used throughout the app.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use "elevated" for shadow-2xl glow version, "flat" for border-only */
  variant?: "default" | "elevated" | "flat" | "inset";
  padding?: "none" | "sm" | "md" | "lg";
}

const VARIANTS: Record<NonNullable<CardProps["variant"]>, string> = {
  default:
    "bg-white border border-slate-200 shadow-sm",
  elevated:
    "bg-white border border-slate-200 shadow-xl",
  flat:
    "bg-slate-50 border border-slate-200",
  inset:
    "bg-white border border-slate-300",
};

const PADDINGS: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-3xl ${VARIANTS[variant]} ${PADDINGS[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader — title + optional subtitle inside a Card
 */
export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
