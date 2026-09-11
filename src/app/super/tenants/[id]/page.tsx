import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { TenantDetail } from "@/features/super-admin/TenantDetail";
import { ImpersonationBanner } from "@/features/super-admin/ImpersonationBar";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "super_admin") {
    return redirect("/login");
  }

  const { id } = await params;
  const db = createSupabaseAdmin();

  // Fetch tenant data
  const { data: tenant, error: tenantError } = await createSupabaseAdmin()
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (tenantError || !tenant) {
    return redirect("/super/tenants");
  }

  // Fetch owner info
  const { data: ownerProfile } = await createSupabaseAdmin()
    .from("cafe_profiles")
    .select("id, display_name, email, role, active, created_at")
    .eq("restaurant_id", id)
    .eq("role", "owner")
    .maybeSingle();

  // Fetch staff members
  const { data: staff } = await createSupabaseAdmin()
    .from("cafe_profiles")
    .select("id, display_name, email, role, active, created_at")
    .eq("restaurant_id", id)
    .order("created_at", { ascending: false });

  // Fetch recent orders for this tenant
  const { data: recentOrders } = await createSupabaseAdmin()
    .from("orders")
    .select("id, order_number, total_paise, payment_status, status, created_at, table_label")
    .eq("restaurant_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch today's stats
  const todayStart = new Date().toISOString().split("T")[0];
  const { data: todayOrders } = await createSupabaseAdmin()
    .from("orders")
    .select("id, total_paise, payment_status, status")
    .eq("restaurant_id", id)
    .gte("created_at", new Date().toISOString().split("T")[0]);

  const todayRevenue = (todayOrders || [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + (o.total_paise || 0), 0);

  return (
    <ImpersonationBanner
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      onExit={() => window.location.href = "/super/tenants"}
    >
      <TenantDetail
        tenant={tenant}
        owner={ownerProfile}
        staff={staff || []}
        recentOrders={recentOrders || []}
        todayRevenue={todayRevenue || 0}
        todayOrdersCount={todayOrders?.length || 0}
      />
    </ImpersonationBanner>
  );
}