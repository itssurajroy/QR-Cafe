import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCustomerBalance } from "@/lib/crm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const restaurant_id = searchParams.get("restaurant_id");
  
  if (!phone || !restaurant_id) {
    return NextResponse.json({ error: "Phone and restaurant_id required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  
  try {
    const balance = await getCustomerBalance(admin, restaurant_id, phone);
    return NextResponse.json(balance);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
