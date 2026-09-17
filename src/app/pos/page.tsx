// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { canOrder } from "@/lib/tenant";
import PosClient from "@/components/PosClient";
import { PrinterProvider } from "@/components/printer/PrinterProvider";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    redirect("/login");
  }

  const db = createSupabaseAdmin();
  const [{ data: restaurant }, { data: categories }, { data: items }, { data: tables }, { data: reservations }] =
    await Promise.all([
      db.from("restaurants").select("*").eq("id", user.restaurantId).single(),
      db
        .from("menu_categories")
        .select("id, restaurant_id, name, sort_order")
        .eq("restaurant_id", user.restaurantId)
        .order("sort_order", { ascending: true }),
      db
        .from("menu_items")
        .select("id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available")
        .eq("restaurant_id", user.restaurantId),
      db
        .from("restaurant_tables")
        .select("id, restaurant_id, label, seats, qr_token, active")
        .eq("restaurant_id", user.restaurantId)
        .order("label", { ascending: true }),
      db
        .from("table_reservations")
        .select("id, table_ids, starts_at, ends_at, status, code, name, phone, party_size")
        .eq("restaurant_id", user.restaurantId)
        .in("status", ["confirmed", "pending"])
        .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

  if (!canOrder(restaurant as any)) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            💳
          </div>
          <h1 className="text-xl font-extrabold text-white">Subscription Required</h1>
          <p className="text-xs text-stone-400 leading-relaxed">
            Your free trial has ended or your subscription is currently inactive. Please renew your plan in the billing portal to continue billing orders.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/billing"
              className="inline-block w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20"
            >
              Go to Billing Portal &rarr;
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PrinterProvider>
      <PosClient
        restaurant={restaurant}
        categories={categories ?? []}
        items={items ?? []}
        tables={tables ?? []}
        reservations={reservations ?? []}
        userRole={user.role}
        userName={user.role === "owner" ? "Owner" : user.role === "manager" ? "Manager" : "Cashier"}
      />
    </PrinterProvider>
  );
}

