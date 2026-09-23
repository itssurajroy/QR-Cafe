// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body; // Fields allowed to be corrected by Data Principal

    if (!name && !phone) {
      return NextResponse.json({ error: "No fields to update provided." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Attempt correction in standard profile (this will fail if user lacks RLS permissions)
    const { error } = await supabase
      .from("cafe_profiles")
      .update({
        ...(name && { name }),
        ...(phone && { phone }),
      })
      .eq("id", user.userId);

    if (error) {
      console.error("Profile correction error:", error);
      return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Personal data corrected successfully." });
  } catch (error: any) {
    console.error("Error correcting personal data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
