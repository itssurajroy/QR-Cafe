import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import AdminClient from "@/components/AdminClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ImpersonateCafePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "super_admin") {
    redirect("/login");
  }

  const { id } = await params;
  const db = createSupabaseAdmin();

  // Load tenant
  const { data: tenant, error } = await db
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !tenant) {
    redirect("/super");
  }

  // Audit impersonation session
  await db.from("audit_events").insert({
    actor_id: user.userId,
    restaurant_id: id,
    entity: "tenant",
    entity_id: id,
    action: "super_impersonate",
    metadata: {
      timestamp: new Date().toISOString(),
      cafe_name: tenant.name,
      slug: tenant.slug,
    },
  });

  // Load tenant data identically to owner /admin
  const [{ data: categories }, { data: items }, { data: tables }, { data: today }] =
    await Promise.all([
      db
        .from("menu_categories")
        .select("id, restaurant_id, name, sort_order")
        .eq("restaurant_id", id)
        .order("sort_order"),
      db
        .from("menu_items")
        .select("id, restaurant_id, category_id, name, price_paise, available, is_veg, description, image_url, hsn")
        .eq("restaurant_id", id),
      db
        .from("restaurant_tables")
        .select("id, restaurant_id, label, seats, qr_token, active")
        .eq("restaurant_id", id)
        .order("label"),
      db
        .from("orders")
        .select("id, restaurant_id, total_paise, payment_status, status")
        .eq("restaurant_id", id)
        .gte("created_at", new Date().toISOString().slice(0, 10)),
    ]);

  const paid = (today ?? []).filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((s, o) => s + (o.total_paise || 0), 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Super Admin Impersonation Top Exit Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 px-6 py-2.5 flex items-center justify-between shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-2 text-xs font-black">
          <span className="text-base">🕵️‍♂️</span>
          <span>IMPERSONATION SESSION: Viewing as &ldquo;{tenant.name}&rdquo; ({tenant.slug})</span>
          <span className="opacity-75 font-mono">[{tenant.tier?.toUpperCase()} / {tenant.plan?.toUpperCase()}]</span>
        </div>
        <Link
          href="/super"
          className="px-3.5 py-1 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <span>✕ Exit to Super Console</span>
        </Link>
      </div>

      <div className="flex-1">
        <AdminClient
          restaurantId={id}
          restaurant={tenant}
          categories={categories ?? []}
          items={items ?? []}
          tables={tables ?? []}
          report={{
            orders: (today ?? []).length,
            paid: paid.length,
            revenue,
            avg: paid.length ? Math.round(revenue / paid.length) : 0,
          }}
        />
      </div>
    </div>
  );
}
