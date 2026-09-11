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
          {["", "trial", "active", "expired"].map((s) => (
            <Link
              key={s || "all"}
              href={filterHref(s)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                status === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
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
