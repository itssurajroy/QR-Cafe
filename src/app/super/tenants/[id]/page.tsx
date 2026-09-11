import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import SubscriptionForm from "./SubscriptionForm";
import TenantDangerZone from "./TenantDangerZone";

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

const TABS = ["overview", "subscription", "users"] as const;
type Tab = (typeof TABS)[number];

export default async function SuperTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login");
  }
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as Tab) : "overview";

  const db = createSupabaseAdmin();
  const { data: tenant } = await db.from("restaurants").select("*").eq("id", id).maybeSingle();
  if (!tenant) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href="/super/tenants" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
            ← Back to tenants
          </Link>
          <p className="text-sm font-bold text-slate-500">Tenant not found.</p>
        </div>
      </main>
    );
  }

  const { data: ownerProfile } = await db
    .from("cafe_profiles")
    .select("id, display_name")
    .eq("restaurant_id", id)
    .eq("role", "owner")
    .maybeSingle();
  let ownerEmail: string | null = null;
  if (ownerProfile) {
    const { data: u } = await db.auth.admin.getUserById(ownerProfile.id);
    ownerEmail = u?.user?.email ?? null;
  }

  const { data: staff } = await db
    .from("cafe_profiles")
    .select("id, role, display_name, active, created_at")
    .eq("restaurant_id", id)
    .order("created_at", { ascending: false });

  const [{ count: orderCount }, { data: paidOrders }] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", id),
    db.from("orders").select("total_paise").eq("restaurant_id", id).eq("payment_status", "paid"),
  ]);
  const revenuePaise = (paidOrders ?? []).reduce((s, o) => s + (o.total_paise || 0), 0);

  const tabHref = (t: Tab) => `/super/tenants/${id}${t === "overview" ? "" : `?tab=${t}`}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/super/tenants" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
            ← Back to tenants
          </Link>
          <Link
            href={`/super/cafe/${id}`}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Impersonate →
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-black">{tenant.name}</h1>
            <p className="text-xs text-slate-500 font-mono">/c/{tenant.slug}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-xs ${badgeClass(tenant.plan)}`}>
            {tenant.plan}
          </span>
        </div>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <Link
              key={t}
              href={tabHref(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize transition-colors ${
                tab === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-2 text-sm">
              <h2 className="text-sm font-black text-slate-900">Tenant</h2>
              <p><span className="text-slate-500">Plan:</span> <strong>{tenant.plan}</strong></p>
              <p><span className="text-slate-500">Tier:</span> <strong>{tenant.tier ?? "—"}</strong></p>
              <p><span className="text-slate-500">Trial ends:</span> <strong>{tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleString() : "—"}</strong></p>
              <p><span className="text-slate-500">Owner:</span> <strong>{(ownerProfile as { display_name: string | null } | null)?.display_name ?? "—"}</strong></p>
              <p><span className="text-slate-500">Owner email:</span> <strong>{ownerEmail ?? "—"}</strong></p>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-2 text-sm">
              <h2 className="text-sm font-black text-slate-900">Usage</h2>
              <p><span className="text-slate-500">Orders:</span> <strong>{orderCount ?? 0}</strong></p>
              <p><span className="text-slate-500">Paid revenue:</span> <strong>₹{(revenuePaise / 100).toLocaleString("en-IN")}</strong></p>
              <p><span className="text-slate-500">Created:</span> <strong>{tenant.created_at ? new Date(tenant.created_at).toLocaleString() : "—"}</strong></p>
            </div>
            <div className="sm:col-span-2">
              <TenantDangerZone id={id} suspended={tenant.plan === "suspended"} />
            </div>
          </div>
        )}

        {tab === "subscription" && (
          <SubscriptionForm
            id={id}
            plan={tenant.plan}
            trialEndsAt={tenant.trial_ends_at ?? null}
            tier={tenant.tier ?? null}
          />
        )}

        {tab === "users" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 uppercase tracking-wider text-xs">
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(staff ?? []).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{s.display_name ?? "—"}</td>
                      <td className="p-4 text-slate-600">{s.role}</td>
                      <td className="p-4 text-slate-600">{s.active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                  {(staff ?? []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400">
                        No staff found for this tenant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
