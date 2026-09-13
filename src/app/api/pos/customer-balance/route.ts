import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { getCustomerBalance } from "@/lib/crm";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  
  if (!phone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  
  try {
    const balance = await getCustomerBalance(admin, user.restaurantId, phone);
    return NextResponse.json(balance);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
