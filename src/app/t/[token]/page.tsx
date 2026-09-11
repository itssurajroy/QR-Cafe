import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantByTableToken, canOrder } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { MenuClient } from "@/features/menu/MenuClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TablePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { tenant, tableId, tableActive } = await getTenantByTableToken(token);

  if (!tenant || !tableId || !tableActive) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 selection:bg-indigo-600 selection:text-white">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center text-3xl mx-auto">
            ⚠️
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Table QR Expired or Inactive</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This QR code is either unassigned or has been deactivated. Please notify the café staff or scan the updated table card.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Check subscription expiry gating
  if (!canOrder(tenant)) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 selection:bg-indigo-600 selection:text-white">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center text-3xl mx-auto">
            ☕
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{tenant.name}</h1>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            🚫 <strong>Ordering Temporarily Paused</strong>
            <p className="text-xs text-amber-600 mt-1">
              The café subscription is currently being renewed. Please order directly with your server.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const db = createSupabaseAdmin();

  // Resolve table label
  const { data: tableData } = await db
    .from("restaurant_tables")
    .select("label")
    .eq("id", tableId)
    .single();

  // Fetch categories and in-stock items
  const [{ data: categories }, { data: items }] = await Promise.all([
    db
      .from("menu_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", tenant.id)
      .order("sort_order"),
    db
      .from("menu_items")
      .select("id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available")
      .eq("restaurant_id", tenant.id)
      .eq("available", true),
  ]);

  return (
    <MenuClient
      qrToken={token}
      tableLabel={tableData?.label || "T01"}
      restaurantName={tenant.name}
      categories={categories ?? []}
      items={items ?? []}
    />
  );
}