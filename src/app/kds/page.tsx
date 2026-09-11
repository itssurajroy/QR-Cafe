import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DedicatedKdsClient } from "@/components/kds/DedicatedKdsClient";

export const dynamic = "force-dynamic";

export default async function KdsPage() {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    redirect("/login");
  }

  const db = createSupabaseAdmin();

  // Load restaurant profile & active kitchen orders
  const [{ data: restaurant }, { data: orders }] = await Promise.all([
    db
      .from("restaurants")
      .select("id, name, slug")
      .eq("id", user.restaurantId)
      .single(),
    db
      .from("orders")
      .select("id, order_number, status, table_label, created_at, notes, customer_name, order_items(id, item_name, quantity, notes, spice_level, size_variant)")
      .eq("restaurant_id", user.restaurantId)
      .in("status", ["pending", "confirmed", "preparing", "ready"])
      .order("created_at", { ascending: true }),
  ]);

  return (
    <DedicatedKdsClient
      restaurantId={user.restaurantId}
      restaurantName={restaurant?.name || "Kitchen OS"}
      restaurantSlug={restaurant?.slug || "cafe"}
      initialOrders={(orders as any) || []}
    />
  );
}
