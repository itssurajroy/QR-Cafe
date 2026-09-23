// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Simple check for a cron secret to prevent unauthorized invocation
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    // 30 days retention policy for Data Erasure under DPDP
    const RETENTION_DAYS = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    // Fetch users who requested erasure before the cutoff date
    const { data: profilesToPurge, error: fetchError } = await supabaseAdmin
      .from("dpdp_privacy_profiles")
      .select("user_id, data_erasure_requested_at")
      .not("data_erasure_requested_at", "is", null)
      .lte("data_erasure_requested_at", cutoffDate.toISOString());

    if (fetchError) {
      console.error("Error fetching profiles for purge:", fetchError);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    if (!profilesToPurge || profilesToPurge.length === 0) {
      return NextResponse.json({ message: "No data retention purging required at this time." });
    }

    let purgedCount = 0;
    for (const profile of profilesToPurge) {
      // 1. Anonymize cafe_profile fields
      const { error: updateError } = await supabaseAdmin
        .from("cafe_profiles")
        .update({
          name: "Anonymous User",
          phone: null,
          email: `anonymized_${profile.user_id}@deleted.local`,
          active: false,
        })
        .eq("id", profile.user_id);

      if (updateError) {
        console.error(`Failed to anonymize profile ${profile.user_id}:`, updateError);
        continue;
      }

      // 2. Optionally, delete from auth.users (if using Supabase Auth natively)
      // await supabaseAdmin.auth.admin.deleteUser(profile.user_id);

      // 3. Mark the privacy profile as fully purged
      await supabaseAdmin
        .from("dpdp_privacy_profiles")
        .update({
          data_erasure_requested_at: null, // Reset or keep it, but we need a flag to know it's done
          is_minor: false,
          parent_consent_verified: false,
          parent_user_id: null,
        })
        .eq("user_id", profile.user_id);

      purgedCount++;
    }

    return NextResponse.json({
      message: `Successfully purged ${purgedCount} user profiles according to DPDP retention policy.`,
      purgedCount,
    });
  } catch (error: any) {
    console.error("Data Retention Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
