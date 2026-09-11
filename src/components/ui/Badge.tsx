/**
 * QRslice UI Library — Badge
 * Status pills used throughout POS, Admin, and Order Tracking.
 */

export interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "amber";
  size?: "xs" | "sm";
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  danger:  "bg-red-50 border-red-200 text-red-700",
  info:    "bg-blue-50 border-blue-200 text-blue-700",
  neutral: "bg-slate-100 border-slate-200 text-slate-700",
  amber:   "bg-amber-50 border-amber-200 text-amber-700",
};

const SIZES: Record<NonNullable<BadgeProps["size"]>, string> = {
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2.5 py-1 text-xs",
};

const DOT_COLORS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
  neutral: "bg-slate-500",
  amber:   "bg-amber-500",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  pulse = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-wider ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[variant]} ${pulse ? "animate-pulse" : ""}`}
        />
      )}
      {children}
    </span>
  );
}

/**
 * OrderStatusBadge — convenience wrapper that maps order status → badge variant
 */
export function OrderStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps["variant"]> = {
    pending:   "neutral",
    confirmed: "info",
    preparing: "warning",
    ready:     "success",
    served:    "success",
    cancelled: "danger",
    rejected:  "danger",
  };

  const labelMap: Record<string, string> = {
    pending:   "Pending",
    confirmed: "Confirmed",
    preparing: "Cooking 🔥",
    ready:     "Ready 🔔",
    served:    "Served ✓",
    cancelled: "Cancelled",
    rejected:  "Rejected",
  };

  return (
    <Badge variant={variantMap[status] ?? "neutral"} dot pulse={status === "preparing"}>
      {labelMap[status] ?? status}
    </Badge>
  );
}

/**
 * PaymentBadge — maps payment status → styled badge
 */
export function PaymentBadge({ status, method }: { status: string; method?: string }) {
  const isPaid = status === "paid";
  return (
    <Badge variant={isPaid ? "success" : "warning"}>
      {isPaid ? `Paid ${method ? `(${method.toUpperCase()})` : ""}` : "Unpaid"}
    </Badge>
  );
}