import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import SuperClient from "@/components/SuperClient";

export const dynamic = "force-dynamic";

export default async function SuperPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; plan?: string; status?: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login");
  }

  const { page = "1", q = "", plan = "", status = "" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10));
  const pageSize = 15;

  const db = createSupabaseAdmin();

  // 1. Filtered & Paginated Cafes
  let query = db
    .from("restaurants")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }
  if (plan) {
    query = query.eq("plan", plan);
  } else if (status) {
    query = query.eq("plan", status);
  }

  const fromIdx = (currentPage - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  const [
    { data: cafes, count: totalCafes },
    { data: allRestaurants },
    { data: staffProfiles },
    { data: todayOrders },
    { data: past14dOrders },
    { data: platformConfigRows },
    { data: recentAudit },
  ] = await Promise.all([
    query.range(fromIdx, toIdx),
    db.from("restaurants").select("id, name, slug, plan, tier, trial_ends_at, subscription_ends_at, billing_status, created_at"),
    db.from("cafe_profiles").select("id, role, display_name, active, restaurant_id, created_at, restaurants(name)").order("created_at", { ascending: false }),
    db.from("orders").select("id, total_paise, payment_status, created_at").gte("created_at", new Date().toISOString().slice(0, 10)),
    db.from("orders").select("id, total_paise, payment_status, created_at, restaurant_id").gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString()),
    db.from("platform_config").select("*"),
    db.from("audit_events").select("*, restaurants(name, slug)").order("created_at", { ascending: false }).limit(50),
  ]);

  // Aggregate Metrics
  const all = allRestaurants || [];
  const activeCafes = all.filter((c) => c.plan === "active");
  const trialCafes = all.filter((c) => c.plan === "trial");
  const suspendedCafes = all.filter((c) => c.plan === "suspended" || c.plan === "cancelled");

  // MRR: Single QR Café Plan (₹999/mo)
  const mrr = activeCafes.length * 999;

  // Today Orders & Revenue
  const today = todayOrders || [];
  const todayPaid = today.filter((o) => o.payment_status === "paid");
  const todayRevenue = todayPaid.reduce((s, o) => s + (o.total_paise || 0), 0);

  // Trial to Paid count & Failed payments
  const trialToPaid = activeCafes.filter((c) => c.trial_ends_at && new Date(c.trial_ends_at).getTime() < Date.now()).length;
  const failedPayments = all.filter((c) => c.billing_status === "past_due").length;
  const new7dCafes = all.filter((c) => new Date(c.created_at).getTime() >= Date.now() - 7 * 864e5).length;
  const trialsEnding7d = all.filter(
    (c) =>
      c.plan === "trial" &&
      c.trial_ends_at &&
      new Date(c.trial_ends_at).getTime() >= Date.now() &&
      new Date(c.trial_ends_at).getTime() <= Date.now() + 7 * 864e5
  ).length;
  const new7d = all.filter((c) => new Date(c.created_at).getTime() >= Date.now() - 7 * 864e5).length;

  // Chart Data: 14d Revenue & Orders
  const dateMap: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(5, 10);
    dateMap[d] = { date: d, revenue: 0, orders: 0 };
  }
  for (const o of past14dOrders || []) {
    const d = (o.created_at || "").slice(5, 10);
    if (dateMap[d]) {
      dateMap[d].orders += 1;
      if (o.payment_status === "paid") {
        dateMap[d].revenue += Math.round((o.total_paise || 0) / 100);
      }
    }
  }
  const revenue14 = Object.values(dateMap);

  // Top 10 Cafes by 14d Revenue
  const cafeRevenueMap: Record<string, number> = {};
  for (const o of past14dOrders || []) {
    if (o.payment_status === "paid" && o.restaurant_id) {
      cafeRevenueMap[o.restaurant_id] = (cafeRevenueMap[o.restaurant_id] || 0) + (o.total_paise || 0);
    }
  }
  const topCafes = Object.entries(cafeRevenueMap)
    .map(([id, rev]) => {
      const rest = all.find((r) => r.id === id);
      return {
        id,
        name: rest?.name || "Café",
        slug: rest?.slug || "",
        revenue_paise: rev,
        tier: rest?.tier || "pro",
      };
    })
    .sort((a, b) => b.revenue_paise - a.revenue_paise)
    .slice(0, 10);

  // Platform config map
  const configMap: Record<string, any> = {};
  for (const row of platformConfigRows || []) {
    configMap[row.key] = row.value;
  }

  // Format staff for list
  const staffList = (staffProfiles || []).map((s: any) => ({
    id: s.id,
    role: s.role,
    display_name: s.display_name,
    active: s.active,
    restaurant_id: s.restaurant_id,
    restaurant_name: s.restaurants?.name || "Global / System",
    created_at: s.created_at,
  }));

  return (
    <SuperClient
      cafes={cafes || []}
      totalCafes={totalCafes || 0}
      page={currentPage}
      pageSize={pageSize}
      q={q}
      planFilter={plan || status}
      staff={staffList}
      kpis={{
        total: all.length,
        active: activeCafes.length,
        trial: trialCafes.length,
        suspended: suspendedCafes.length,
        mrr,
        todayOrders: today.length,
        todayRevenue,
        trialToPaid,
        failedPayments,
        new7dCafes,
        trialsEnding7d,
        new7d,
      }}
      charts={{
        revenue14,
        byPlan: [
          { name: "Active", value: activeCafes.length, color: "#10b981" },
          { name: "Free Trial", value: trialCafes.length, color: "#f59e0b" },
          { name: "Suspended", value: suspendedCafes.length, color: "#ef4444" },
        ],
        topCafes,
      }}
      config={configMap}
      recentAudit={recentAudit || []}
    />
  );
}
