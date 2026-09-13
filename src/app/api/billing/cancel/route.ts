// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const { data: rest } = await db
    .from("restaurants")
    .select("id, razorpay_subscription_id")
    .eq("id", user.restaurantId)
    .single();

  if (rest?.razorpay_subscription_id) {
    await razorpay.cancelSubscription(rest.razorpay_subscription_id);
  }

  await db
    .from("restaurants")
    .update({
      plan: "suspended",
      billing_status: "cancelled",
    })
    .eq("id", user.restaurantId);

  return NextResponse.json({ ok: true, message: "Subscription cancelled successfully." });
}

