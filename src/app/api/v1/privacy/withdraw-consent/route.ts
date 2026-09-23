// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consentCache } from "@/lib/middleware/cache";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "0.0.0.0";

    const { error: logError } = await supabase
      .from("dpdp_consent_logs")
      .insert({
        user_id: user.userId,
        consent_version: "v1.0",
        consent_given: false,
        channels_authorized: [],
        ip_address: clientIp,
      });

    if (logError) {
      console.error("Withdraw consent logging error:", logError);
      return NextResponse.json(
        { error: "Failed to process consent withdrawal." },
        { status: 500 }
      );
    }

    // Immediately invalidate the edge cache so the next request gets blocked by middleware
    consentCache.delete(user.userId);

    return NextResponse.json({
      success: true,
      message: "Consent successfully withdrawn. Processing of your personal data has been paused.",
    });
  } catch (error: any) {
    console.error("Error withdrawing consent:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
