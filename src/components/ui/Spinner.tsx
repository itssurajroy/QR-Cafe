/**
 * QR Café UI Library — Spinner & EmptyState
 */

// ─── Spinner ──────────────────────────────────────────────────────────────────

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: "amber" | "white" | "stone";
  className?: string;
}

const SPINNER_SIZES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "w-3 h-3 border-2",
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-4",
  lg: "w-12 h-12 border-4",
};

const SPINNER_COLORS: Record<NonNullable<SpinnerProps["color"]>, string> = {
  amber: "border-amber-500 border-t-transparent",
  white: "border-white border-t-transparent",
  stone: "border-stone-500 border-t-transparent",
};

export function Spinner({ size = "md", color = "amber", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`rounded-full animate-spin ${SPINNER_SIZES[size]} ${SPINNER_COLORS[color]} ${className}`}
    />
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = "☕", title, subtitle, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`text-center py-16 px-6 bg-stone-900/40 rounded-3xl border border-dashed border-stone-800 ${className}`}
    >
      {typeof icon === "string" ? (
        <div className="text-4xl mb-4 animate-float">{icon}</div>
      ) : (
        <div className="flex justify-center mb-4">{icon}</div>
      )}
      <p className="text-stone-200 font-bold text-sm">{title}</p>
      {subtitle && (
        <p className="text-stone-500 text-xs mt-1 leading-relaxed">{subtitle}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── LoadingPage ──────────────────────────────────────────────────────────────

/** Full-page centered spinner used while data loads */
export function LoadingPage({ message = "Loading…" }: { message?: string }) {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs text-stone-400 font-mono">{message}</p>
      </div>
    </main>
  );
}
