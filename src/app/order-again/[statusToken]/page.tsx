// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Validate an order-again status token against the `orders` table.
 * Mirrors the lookup behind `src/app/order/[statusToken]/page.tsx`
 * (which fetches `/api/order-status/[token]`, itself backed by the
 * status_token → id → order_number chain in
 * `src/app/api/order-status/[token]/route.ts`).
 */
export async function orderAgainTokenExists(
  statusToken: string,
): Promise<boolean> {
  if (
    !statusToken ||
    typeof statusToken !== "string" ||
    statusToken.length < 3 ||
    statusToken.length > 64
  ) {
    return false;
  }
  const db = createSupabaseAdmin();

  const { data: byStatusToken } = await db
    .from("orders")
    .select("id")
    .eq("status_token", statusToken)
    .maybeSingle();
  if (byStatusToken) return true;

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      statusToken,
    )
  ) {
    const { data: byId } = await db
      .from("orders")
      .select("id")
      .eq("id", statusToken)
      .maybeSingle();
    if (byId) return true;
  }

  const { data: byNumber } = await db
    .from("orders")
    .select("id")
    .eq("order_number", statusToken)
    .maybeSingle();
  return Boolean(byNumber);
}

export default async function OrderAgainPage({
  params,
}: {
  params: Promise<{ statusToken: string }>;
}) {
  const { statusToken } = await params;
  const exists = await orderAgainTokenExists(statusToken);
  if (exists) {
    redirect(`/order/${statusToken}`);
  }
  // Friendly terminal state — never redirect here (avoids redirect loops).
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-4">
        <h2 className="text-xl font-black text-slate-900">Order not found</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          This reorder link is invalid or the order no longer exists. Please
          scan the QR code at your table to start a fresh order.
        </p>
        <a
          href="/"
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-xs inline-flex items-center gap-2 min-h-[44px]"
        >
          Return to Home
        </a>
      </div>
    </main>
  );
}
