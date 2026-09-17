// Copyright (c) 2026 QRslice. All rights reserved.
import type { MetadataRoute } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";
  const admin = createSupabaseAdmin();

  const { data: restaurants, error } = await admin
    .from("restaurants")
    .select("slug, updated_at")
    .eq("plan", "active")
    .order("updated_at", { ascending: false });

  if (error || !restaurants) {
    return [];
  }

  return restaurants.map((restaurant) => ({
    url: `${baseUrl}/c/${restaurant.slug}`,
    lastModified: restaurant.updated_at ? new Date(restaurant.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}