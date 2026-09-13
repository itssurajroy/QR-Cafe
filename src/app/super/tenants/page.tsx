import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import CreateTenantForm from "./CreateTenantForm";
import TenantsExportButton from "./TenantsExportButton";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, string> = {
  trial: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-700",
  suspended: "bg-slate-800 text-white",
};

function badgeClass(plan: string): string {
  return STATUS_BADGES[plan] ?? "bg-red-100 text-red-700";
}

export default async function SuperTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login");
  }

  const { q = "", status = "", page = "1" } = await searchParams;
  const search = q.trim();
  const currentPage = Math.max(1, parseInt(page, 10));
  const limit = 15;

  const db = createSupabaseAdmin();
  let query = db
    .from("restaurants")
    .select("id, name, slug, plan, tier, trial_ends_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  if (status) query = query.eq("plan", status);
  const { data, count } = await query.range((currentPage - 1) * limit, currentPage * limit - 1);

  const rows = data ?? [];
  const ids = rows.map((r) => r.id);
  let owners: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: profiles } = await db
      .from("cafe_profiles")
      .select("id, restaurant_id")
      .eq("role", "owner")
      .in("restaurant_id", ids);
    for (const p of profiles ?? []) {
      const { data: u } = await db.auth.admin.getUserById(p.id);
      if (u?.user?.email && p.restaurant_id) owners[p.restaurant_id] = u.user.email;
    }
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // last_active_at may not exist yet (Task-1 migration unapplied) — degrade gracefully, never crash.
  let lastActive: Record<string, string> = {};
  if (ids.length > 0) {
    try {
      const { data: activeRows, error: activeErr } = await db
        .from("restaurants")
        .select("id, last_active_at")
        .in("id", ids);
      if (!activeErr) {
        for (const r of activeRows ?? []) {
          const v = (r as { id: string; last_active_at?: string | null }).last_active_at;
          if (v) lastActive[r.id] = v;
        }
      }
    } catch {
      lastActive = {};
    }
  }
  const filterHref = (s: string) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (s) params.set("status", s);
    return `/super/tenants${params.toString() ? `?${params.toString()}` : ""}`;
  };
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (p > 1) params.set("page", String(p));
    return `/super/tenants${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black">Tenants</h1>
            <p className="text-xs text-slate-500">
              {total} cafés{status ? ` · ${status}` : ""}{search ? ` · “${search}”` : ""}
            </p>
          </div>
          <Link href="/super" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
            ← Back to console
          </Link>
        </div>

        <CreateTenantForm />

        <form method="GET" className="flex flex-col sm:flex-row gap-3 items-center bg-white border border-slate-200 p-4 rounded-2xl">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search by café name or slug…"
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer">
            Search
          </button>
        </form>

        <div className="flex gap-2 items-center flex-wrap">
          {["", "trial", "active", "expired", "suspended"].map((s) => (
            <Link
              key={s || "all"}
              href={filterHref(s)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                status === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              {s || "All"}
            </Link>
          ))}
          <span className="ml-auto">
            <TenantsExportButton
              rows={rows.map((r) => ({
                name: r.name,
                slug: r.slug,
                owner_email: owners[r.id] ?? null,
                plan: r.plan,
                trial_ends_at: r.trial_ends_at,
                created_at: r.created_at,
              }))}
            />
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 uppercase tracking-wider text-xs">
                  <th className="p-4">Café</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Owner email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{r.name}</td>
                    <td className="p-4 font-mono text-slate-500">/c/{r.slug}</td>
                    <td className="p-4 text-slate-600">{owners[r.id] ?? "—"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-xs ${badgeClass(r.plan)}`}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {lastActive[r.id] ? new Date(lastActive[r.id]).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/super/cafe/${r.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs inline-block transition-colors"
                      >
                        Impersonate
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No tenants match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{rows.length}</strong> of <strong>{total}</strong> (Page {currentPage} of {totalPages})
            </span>
            <div className="flex gap-2">
              <Link
                href={pageHref(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 ${currentPage <= 1 ? "opacity-30 pointer-events-none" : "hover:bg-slate-100"}`}
              >
                &larr; Previous
              </Link>
              <Link
                href={pageHref(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 ${currentPage >= totalPages ? "opacity-30 pointer-events-none" : "hover:bg-slate-100"}`}
              >
                Next &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
