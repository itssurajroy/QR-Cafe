// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();

    // Upsert privacy profile to set data_erasure_requested_at
    const { error: profileError } = await supabase
      .from("dpdp_privacy_profiles")
      .upsert(
        { user_id: user.userId, data_erasure_requested_at: now },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Data erasure request error:", profileError);
      return NextResponse.json(
        { error: "Failed to initiate data erasure request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data erasure request initiated. PII will be soft-deleted and permanently removed according to retention policy.",
      requestedAt: now,
    });
  } catch (error: any) {
    console.error("Error initiating data erasure:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
