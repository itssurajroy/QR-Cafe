// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Fetch primary profile data (this covers basic account info)
    const { data: profile } = await supabase
      .from("cafe_profiles")
      .select("role, restaurant_id, created_at")
      .eq("id", user.userId)
      .single();

    // Fetch DPDP privacy profile
    const { data: privacyProfile } = await supabase
      .from("dpdp_privacy_profiles")
      .select("*")
      .eq("user_id", user.userId)
      .maybeSingle();

    // Fetch recent consent logs
    const { data: consentLogs } = await supabase
      .from("dpdp_consent_logs")
      .select("consent_version, consent_given, channels_authorized, created_at, ip_address")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Build the access summary
    const summary = {
      userId: user.userId,
      requestTimestamp: new Date().toISOString(),
      accountData: {
        role: profile?.role,
        restaurantId: profile?.restaurant_id,
        createdAt: profile?.created_at,
      },
      privacyProfile: privacyProfile || null,
      consentHistory: consentLogs || [],
      thirdPartyProcessors: [
        {
          processor: "Supabase",
          purpose: "Database & Authentication",
          dataCategories: ["Identity", "Profile", "App Data"],
        },
        {
          processor: "Razorpay",
          purpose: "Payment Processing",
          dataCategories: ["Billing Info", "Transactions"],
        },
        {
          processor: "Resend",
          purpose: "Transactional Emails",
          dataCategories: ["Email Address"],
        },
      ],
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Error generating privacy access summary:", error);
    return NextResponse.json(
      { error: "Failed to generate access summary" },
      { status: 500 }
    );
  }
}
