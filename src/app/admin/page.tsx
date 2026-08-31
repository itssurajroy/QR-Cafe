import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import AdminClient from "@/components/AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role === "super_admin" || !user.restaurantId) {
    redirect("/login");
  }

  // Use service role admin client on server component to eliminate PostgreSQL RLS recursion
  const db = createSupabaseAdmin();
  const [
    { data: restaurant },
    { data: categories },
    { data: items },
    { data: tables },
    { data: today },
  ] = await Promise.all([
    db
      .from("restaurants")
      .select("*")
      .eq("id", user.restaurantId)
      .single(),
    db
      .from("menu_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", user.restaurantId)
      .order("sort_order"),
    db
      .from("menu_items")
      .select("id, restaurant_id, category_id, name, price_paise, available, is_veg, description, image_url, hsn")
      .eq("restaurant_id", user.restaurantId),
    db
      .from("restaurant_tables")
      .select("id, restaurant_id, label, seats, qr_token, active")
      .eq("restaurant_id", user.restaurantId)
      .order("label"),
    db
      .from("orders")
      .select("id, restaurant_id, total_paise, payment_status, status")
      .eq("restaurant_id", user.restaurantId)
      .gte("created_at", new Date().toISOString().slice(0, 10)),
  ]);

  const paid = (today ?? []).filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((s, o) => s + (o.total_paise || 0), 0);

  return (
    <AdminClient
      restaurantId={user.restaurantId}
      restaurant={restaurant}
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
  );
}
