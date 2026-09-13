// Copyright (c) 2026 QRslice. All rights reserved.
import { notFound } from "next/navigation";
import { getRestaurantBySlug, canOrder, getTierLimits } from "@/lib/tenant";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import PublicCafeClient from "@/components/PublicCafeClient";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getRestaurantBySlug(slug);
  if (!tenant) return { title: "Restaurant Not Found" };

  return {
    title: `${tenant.name} — Digital Menu & Contactless Table Ordering`,
    description: `Browse the fresh culinary menu and place contactless table orders at ${tenant.name}. Prepared fresh, delivered right to your table.`,
    openGraph: {
      title: `${tenant.name} | Digital Menu & Table Ordering`,
      description: `Browse dishes, customize your order, and pay seamlessly from your phone at ${tenant.name}.`,
      images: tenant.logo_url ? [tenant.logo_url] : [],
    },
  };
}

export default async function PublicCafePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getRestaurantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const db = createSupabaseAdmin();
  const [{ data: categories }, { data: items }, { data: tables }] = await Promise.all([
    db
      .from("menu_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", tenant.id)
      .order("sort_order", { ascending: true }),
    db
      .from("menu_items")
      .select("id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available")
      .eq("restaurant_id", tenant.id)
      .eq("available", true),
    db
      .from("restaurant_tables")
      .select("id, label, seats, qr_token, active")
      .eq("restaurant_id", tenant.id)
      .eq("active", true)
      .order("label", { ascending: true }),
  ]);

  const orderable = canOrder(tenant);
  const limits = getTierLimits(tenant.tier);

  return (
    <div
      style={
        {
          "--accent": tenant.accent_color || "#f59e0b",
        } as React.CSSProperties
      }
    >
      <PublicCafeClient
        restaurant={tenant}
        tables={tables ?? []}
        categories={categories ?? []}
        items={items ?? []}
        canOrder={orderable}
        limits={limits}
        upiQrUrl={tenant.upi_qr_url || undefined}
      />
    </div>
  );
}
