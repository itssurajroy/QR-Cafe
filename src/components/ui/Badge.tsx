/**
 * QR Café UI Library — Badge
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
  success: "bg-emerald-950/80 border-emerald-700 text-emerald-400",
  warning: "bg-amber-950/80 border-amber-700 text-amber-400",
  danger:  "bg-red-950/80 border-red-700 text-red-400",
  info:    "bg-blue-950/80 border-blue-700 text-blue-400",
  neutral: "bg-stone-900 border-stone-700 text-stone-400",
  amber:   "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

const SIZES: Record<NonNullable<BadgeProps["size"]>, string> = {
  xs: "px-1.5 py-0.5 text-[9px]",
  sm: "px-2.5 py-1 text-[10px]",
};

const DOT_COLORS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger:  "bg-red-400",
  info:    "bg-blue-400",
  neutral: "bg-stone-400",
  amber:   "bg-amber-400",
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
