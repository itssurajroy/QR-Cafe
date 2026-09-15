// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import AdminClient from "@/components/AdminClient";
import Link from "next/link";
import { ImpersonationBanner } from "@/features/super-admin/ImpersonationBar";

export const dynamic = "force-dynamic";

export default async function ImpersonateCafePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
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
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col pt-12">
      {/* Impersonation Banner */}
      <ImpersonationBanner
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
      />

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
