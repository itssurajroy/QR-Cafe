// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser();
    if (!auth || !auth.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const adminDb = createSupabaseAdmin();
    let dbQuery = adminDb
      .from("customers")
      .select("*")
      .eq("restaurant_id", auth.restaurantId)
      .order("created_at", { ascending: false });

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
    }

    const { data: customers, error } = await dbQuery.limit(50);

    if (error) {
      // Return empty list gracefully if table is fresh or error occurs
      return NextResponse.json({ customers: [] });
    }

    return NextResponse.json({ customers: customers || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser();
    if (!auth || !auth.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const adminDb = createSupabaseAdmin();
    const { data: customer, error } = await adminDb
      .from("customers")
      .upsert(
        {
          restaurant_id: auth.restaurantId,
          name,
          phone,
          email: email || null,
          last_visit: new Date().toISOString(),
        },
        { onConflict: "restaurant_id,phone" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ customer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

