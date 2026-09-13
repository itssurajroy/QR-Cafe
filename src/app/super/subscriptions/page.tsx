// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import SuperBulkExtend from "@/components/SuperBulkExtend";

export const dynamic = "force-dynamic";

export default async function SuperSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login");
  }

  const { status = "" } = await searchParams;
  const db = createSupabaseAdmin();

  let query = db
    .from("restaurants")
    .select("id, name, slug, plan, subscription_status, trial_ends_at, billing_status")
    .order("trial_ends_at", { ascending: true });
  if (status) query = query.eq("plan", status);
  const { data } = await query;
  const rows = data ?? [];

  const filterHref = (s: string) =>
    `/super/subscriptions${s ? `?status=${s}` : ""}`;

  const STATUS_STYLE: Record<string, string> = {
    confirmed: "bg-emerald-50 border-emerald-200 text-emerald-700",
    trial: "bg-amber-50 border-amber-200 text-amber-700",
    expired: "bg-red-50 border-red-200 text-red-700",
    suspended: "bg-slate-800 text-white",
    cancelled: "bg-slate-50 border-slate-200 text-slate-600",
    paid: "bg-emerald-50 border-emerald-200 text-emerald-700",
    unpaid: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black">Subscriptions</h1>
            <p className="text-xs text-slate-500">
              {rows.length} tenants{status ? ` · ${status}` : ""}
            </p>
          </div>
          <Link
            href="/super"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
          >
            ← Back to console
          </Link>
        </div>

        <div className="flex gap-2">
          {["", "trial", "active", "expired", "suspended", "cancelled"].map((s) => (
            <Link
              key={s || "all"}
              href={`/super/subscriptions${status === s ? "" : `?status=${s}`}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                status === s
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>

        <SuperBulkExtend rows={rows} />
      </div>
    </main>
  );
}
