// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import BillingClient from "@/components/BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user || user.role === "super_admin" || !user.restaurantId) {
    redirect("/login");
  }
  // Billing management is owner-only, matching /api/billing/* gates.
  // (Staff/manager tabs are already blocked by canAccessTab.)
  if (user.role !== "owner") {
    redirect("/admin");
  }

  const db = createSupabaseAdmin();
  const { data: restaurant } = await db
    .from("restaurants")
    .select(
      "id, name, slug, plan, tier, trial_ends_at, subscription_ends_at, billing_status, razorpay_customer_id, razorpay_subscription_id",
    )
    .eq("id", user.restaurantId)
    .single();

  return <BillingClient restaurant={restaurant} />;
}

