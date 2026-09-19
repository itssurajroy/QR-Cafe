import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCustomerBalance } from "@/lib/crm";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate-limit: 20 requests per 60s per IP to prevent phone number and balance scraping
  const rl = rateLimit(`pub-balance:${ip}`, 20, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim();
  const restaurant_id = searchParams.get("restaurant_id")?.trim();

  if (!phone || !restaurant_id) {
    return NextResponse.json({ error: "Phone and restaurant_id required" }, { status: 400 });
  }

  // Validate phone format: 7 to 16 digits/plus
  if (!/^[+]?[0-9]{7,16}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  try {
    const balance = await getCustomerBalance(admin, restaurant_id, phone);
    return NextResponse.json(balance);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
