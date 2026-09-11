import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ACTION_OPTIONS = [
  "",
  "super_impersonate",
  "super_extend_trial",
  "super_mark_paid",
  "self_onboarding",
  "super_create_tenant",
  "super_suspend",
  "super_activate",
  "super_force_expire",
  "super_accept",
  "super_subscription_edit",
];

export default async function SuperAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    actor?: string;
    entity?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login");
  }

  const { action = "", actor = "", entity = "", from = "", to = "", page = "1" } =
    await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10));
  const limit = 15;

  const db = createSupabaseAdmin();
  let query = db
    .from("audit_events")
    .select("id, actor_id, restaurant_id, entity, entity_id, action, metadata, created_at, restaurants(name, slug)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (action) query = query.eq("action", action);
  if (actor) query = query.eq("actor_id", actor);
  if (entity) query = query.eq("entity", entity);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, count } = await query.range(
    (currentPage - 1) * limit,
    currentPage * limit - 1
  );

  const rows = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (actor) params.set("actor", actor);
    if (entity) params.set("entity", entity);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (p > 1) params.set("page", String(p));
    return `/super/audit${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black">Audit Log</h1>
            <p className="text-xs text-slate-500">
              {total} events{action ? ` · ${action}` : ""}
              {entity ? ` · ${entity}` : ""} (Page {currentPage} of {totalPages})
            </p>
          </div>
          <Link
            href="/super"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
          >
            ← Back to console
          </Link>
        </div>

        <form
          method="GET"
          className="flex flex-col lg:flex-row gap-3 bg-white border border-slate-200 p-4 rounded-2xl"
        >
          <select
            name="action"
            defaultValue={action}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a || "all"} value={a}>
                {a || "All actions"}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="entity"
            defaultValue={entity}
            placeholder="Entity (e.g. tenant)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <input
            type="hidden"
            name="actor"
            value={actor}
          />
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
          />
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 uppercase tracking-wider text-xs">
                  <th className="p-4">Time</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {(a.actor_id ?? "—").slice(0, 8)}
                    </td>
                    <td className="p-4 font-bold text-slate-900">{a.action}</td>
                    <td className="p-4 font-mono text-slate-500">
                      {a.entity}:{String(a.entity_id ?? "—").slice(0, 8)}
                    </td>
                    <td className="p-4 text-slate-600">
                      {a.restaurants?.name ?? "—"}
                      {a.restaurants?.slug ? (
                        <span className="block font-mono text-slate-400">
                          /c/{a.restaurants.slug}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4 text-slate-600 max-w-[280px]">
                      <details className="cursor-pointer">
                        <summary className="font-bold text-indigo-600 hover:text-indigo-500">
                          View metadata
                        </summary>
                        <pre className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs whitespace-pre-wrap break-all">
                          {JSON.stringify(a.metadata ?? null, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No audit events match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong>{rows.length}</strong> of <strong>{total}</strong>{" "}
              (Page {currentPage} of {totalPages})
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
